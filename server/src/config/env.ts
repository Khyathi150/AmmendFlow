import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env from cwd (e.g. server/) or repo root server/.env
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export type StorageProviderType = 'local' | 's3';

export interface EnvConfig {
  PORT: number;
  HOST: string;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CLIENT_URL: string;
  STORAGE_PROVIDER: StorageProviderType;
  UPLOAD_DIR: string;
  S3_BUCKET: string;
  S3_REGION: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  S3_ENDPOINT: string;
  S3_FORCE_PATH_STYLE: boolean;
  S3_PUBLIC_URL: string;
  S3_SIGNED_URL_EXPIRES_SEC: number;
  PUBLIC_API_URL: string;
}

const WEAK_SECRET_PATTERNS = [
  'your-super-secure-jwt-secret-at-least-32-characters',
  'amendflow-super-secure-production-jwt-secret-2026',
  'changeme',
  'secret',
  'dev-secret',
  'test-secret',
];

function normalizeOrigin(rawUrl: string, varName: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`[Config] FATAL: ${varName} ("${rawUrl}") is not a valid URL.`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`[Config] FATAL: ${varName} must use http:// or https:// protocol.`);
  }

  return parsed.origin;
}

function isPlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    WEAK_SECRET_PATTERNS.some((p) => lower === p) ||
    lower.includes('your-') ||
    lower.includes('replace-') ||
    lower.includes('<user>') ||
    lower.includes('<password>')
  );
}

export function buildEnvConfig(rawEnv: NodeJS.ProcessEnv): EnvConfig {
  const nodeEnv = rawEnv.NODE_ENV?.trim() || 'development';
  const isProd = nodeEnv === 'production';

  const portRaw = rawEnv.PORT?.trim() || '5000';
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[Config] FATAL: Invalid PORT "${portRaw}". Must be an integer between 1 and 65535.`);
  }

  const host = rawEnv.HOST?.trim() || '0.0.0.0';

  // 1. JWT_SECRET enforcement
  const rawJwtSecret = rawEnv.JWT_SECRET?.trim() || '';
  let jwtSecret: string;
  if (isProd) {
    if (!rawJwtSecret || rawJwtSecret.length < 32 || isPlaceholder(rawJwtSecret)) {
      throw new Error(
        '[Config] FATAL: A strong JWT_SECRET (>= 32 characters, non-placeholder) is required in production.'
      );
    }
    jwtSecret = rawJwtSecret;
  } else {
    jwtSecret =
      rawJwtSecret ||
      crypto.createHash('sha256').update(`amendflow-dev-only:${process.cwd()}`).digest('hex');
  }

  // 2. MONGODB_URI enforcement
  const mongoUri = rawEnv.MONGODB_URI?.trim() || '';
  if (isProd) {
    if (!mongoUri) {
      throw new Error('[Config] FATAL: MONGODB_URI is required in production.');
    }
  }
  if (mongoUri) {
    const validScheme = mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://');
    if (!validScheme || isPlaceholder(mongoUri)) {
      throw new Error(
        '[Config] FATAL: MONGODB_URI must be a valid mongodb:// or mongodb+srv:// connection string without template placeholders.'
      );
    }
  }

  // 3. CLIENT_URL enforcement
  const rawClientUrl = rawEnv.CLIENT_URL?.trim() || '';
  let clientUrl: string;
  if (isProd) {
    if (!rawClientUrl) {
      throw new Error(
        '[Config] FATAL: CLIENT_URL must be configured to the exact frontend origin (e.g. https://app.example.com) in production.'
      );
    }
    clientUrl = normalizeOrigin(rawClientUrl, 'CLIENT_URL');
  } else {
    clientUrl = normalizeOrigin(rawClientUrl || 'http://localhost:5173', 'CLIENT_URL');
  }

  // 4. Persistent Object Storage vs Development Local Storage enforcement
  const rawStorageProvider = rawEnv.STORAGE_PROVIDER?.trim().toLowerCase();
  let storageProvider: StorageProviderType;
  if (isProd) {
    if (rawStorageProvider === 'local') {
      throw new Error(
        '[Config] FATAL: STORAGE_PROVIDER=local cannot be used in production. Configure persistent S3-compatible object storage (STORAGE_PROVIDER=s3).'
      );
    }
    if (rawStorageProvider && rawStorageProvider !== 's3') {
      throw new Error(
        `[Config] FATAL: Invalid STORAGE_PROVIDER "${rawStorageProvider}". Must be "s3" in production.`
      );
    }
    storageProvider = 's3';
  } else {
    if (rawStorageProvider && rawStorageProvider !== 'local' && rawStorageProvider !== 's3') {
      throw new Error(
        `[Config] FATAL: Invalid STORAGE_PROVIDER "${rawStorageProvider}". Expected "local" or "s3".`
      );
    }
    storageProvider = rawStorageProvider === 's3' ? 's3' : 'local';
  }

  const s3Bucket = rawEnv.S3_BUCKET?.trim() || '';
  const s3Region = rawEnv.S3_REGION?.trim() || '';
  const s3AccessKeyId = rawEnv.S3_ACCESS_KEY_ID?.trim() || '';
  const s3SecretAccessKey = rawEnv.S3_SECRET_ACCESS_KEY?.trim() || '';
  const s3Endpoint = rawEnv.S3_ENDPOINT?.trim() || '';
  const s3ForcePathStyle = rawEnv.S3_FORCE_PATH_STYLE?.trim().toLowerCase() === 'true';
  const s3PublicUrl = rawEnv.S3_PUBLIC_URL?.trim().replace(/\/+$/, '') || '';
  const s3SignedUrlExpiresSec =
    Number.parseInt(rawEnv.S3_SIGNED_URL_EXPIRES_SEC?.trim() || '900', 10) || 900;

  if (storageProvider === 's3') {
    const missing: string[] = [];
    if (!s3Bucket || isPlaceholder(s3Bucket)) missing.push('S3_BUCKET');
    if (!s3Region || isPlaceholder(s3Region)) missing.push('S3_REGION');
    if (!s3AccessKeyId || isPlaceholder(s3AccessKeyId)) missing.push('S3_ACCESS_KEY_ID');
    if (!s3SecretAccessKey || isPlaceholder(s3SecretAccessKey)) missing.push('S3_SECRET_ACCESS_KEY');

    if (missing.length > 0) {
      throw new Error(
        `[Config] FATAL: Persistent object storage (STORAGE_PROVIDER=s3) requires valid credentials: ${missing.join(', ')}.`
      );
    }
    if (s3Endpoint) {
      normalizeOrigin(s3Endpoint, 'S3_ENDPOINT');
    }
  }

  const uploadDir = path.resolve(rawEnv.UPLOAD_DIR?.trim() || path.resolve(process.cwd(), 'uploads'));
  const publicApiUrl = rawEnv.PUBLIC_API_URL?.trim().replace(/\/+$/, '') || '';

  return {
    PORT: port,
    HOST: host,
    NODE_ENV: nodeEnv,
    MONGODB_URI: mongoUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: rawEnv.JWT_EXPIRES_IN?.trim() || '7d',
    CLIENT_URL: clientUrl,
    STORAGE_PROVIDER: storageProvider,
    UPLOAD_DIR: uploadDir,
    S3_BUCKET: s3Bucket,
    S3_REGION: s3Region,
    S3_ACCESS_KEY_ID: s3AccessKeyId,
    S3_SECRET_ACCESS_KEY: s3SecretAccessKey,
    S3_ENDPOINT: s3Endpoint,
    S3_FORCE_PATH_STYLE: s3ForcePathStyle,
    S3_PUBLIC_URL: s3PublicUrl,
    S3_SIGNED_URL_EXPIRES_SEC: s3SignedUrlExpiresSec,
    PUBLIC_API_URL: publicApiUrl,
  };
}

export const env: EnvConfig = buildEnvConfig(process.env);
