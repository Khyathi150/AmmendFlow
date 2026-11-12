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

export type StorageProviderType = 'local' | 'cloudinary';

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
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_FOLDER: string;
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

  // 4. Persistent Cloudinary Object Storage vs Development Local Storage enforcement
  const rawStorageProvider = rawEnv.STORAGE_PROVIDER?.trim().toLowerCase();
  let storageProvider: StorageProviderType;
  if (isProd) {
    if (rawStorageProvider === 'local') {
      throw new Error(
        '[Config] FATAL: STORAGE_PROVIDER=local cannot be used in production. Configure persistent Cloudinary storage (STORAGE_PROVIDER=cloudinary).'
      );
    }
    if (rawStorageProvider && rawStorageProvider !== 'cloudinary') {
      throw new Error(
        `[Config] FATAL: Invalid STORAGE_PROVIDER "${rawStorageProvider}". Must be "cloudinary" in production.`
      );
    }
    storageProvider = 'cloudinary';
  } else {
    if (rawStorageProvider && rawStorageProvider !== 'local' && rawStorageProvider !== 'cloudinary') {
      throw new Error(
        `[Config] FATAL: Invalid STORAGE_PROVIDER "${rawStorageProvider}". Expected "local" or "cloudinary".`
      );
    }
    storageProvider = rawStorageProvider === 'cloudinary' ? 'cloudinary' : 'local';
  }

  let cloudinaryCloudName = rawEnv.CLOUDINARY_CLOUD_NAME?.trim() || '';
  let cloudinaryApiKey = rawEnv.CLOUDINARY_API_KEY?.trim() || '';
  let cloudinaryApiSecret = rawEnv.CLOUDINARY_API_SECRET?.trim() || '';
  const rawCloudinaryUrl = rawEnv.CLOUDINARY_URL?.trim() || '';

  if (rawCloudinaryUrl) {
    let parsedCloudinaryUrl: URL;
    try {
      parsedCloudinaryUrl = new URL(rawCloudinaryUrl);
    } catch {
      throw new Error('[Config] FATAL: CLOUDINARY_URL is malformed.');
    }
    if (parsedCloudinaryUrl.protocol !== 'cloudinary:') {
      throw new Error('[Config] FATAL: CLOUDINARY_URL must start with cloudinary://.');
    }
    cloudinaryCloudName = cloudinaryCloudName || parsedCloudinaryUrl.hostname;
    cloudinaryApiKey = cloudinaryApiKey || decodeURIComponent(parsedCloudinaryUrl.username);
    cloudinaryApiSecret = cloudinaryApiSecret || decodeURIComponent(parsedCloudinaryUrl.password);
  }

  const cloudinaryFolder = (rawEnv.CLOUDINARY_FOLDER?.trim() || 'amendflow').replace(/^\/+|\/+$/g, '');

  if (storageProvider === 'cloudinary') {
    const missing: string[] = [];
    if (!cloudinaryCloudName || isPlaceholder(cloudinaryCloudName)) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!cloudinaryApiKey || isPlaceholder(cloudinaryApiKey)) missing.push('CLOUDINARY_API_KEY');
    if (!cloudinaryApiSecret || isPlaceholder(cloudinaryApiSecret)) missing.push('CLOUDINARY_API_SECRET');

    if (missing.length > 0) {
      throw new Error(
        `[Config] FATAL: Persistent Cloudinary storage (STORAGE_PROVIDER=cloudinary) requires valid backend credentials: ${missing.join(', ')}.`
      );
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
    CLOUDINARY_CLOUD_NAME: cloudinaryCloudName,
    CLOUDINARY_API_KEY: cloudinaryApiKey,
    CLOUDINARY_API_SECRET: cloudinaryApiSecret,
    CLOUDINARY_FOLDER: cloudinaryFolder,
    PUBLIC_API_URL: publicApiUrl,
  };
}

export const env: EnvConfig = buildEnvConfig(process.env);
