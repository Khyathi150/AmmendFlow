import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env, EnvConfig, StorageProviderType } from '../config/env.js';

export interface UploadObjectParams {
  orgId: string;
  projectId: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
}

export interface UploadedObjectResult {
  storageProvider: StorageProviderType;
  storageKey: string;
}

export interface ObjectStreamResult {
  stream: Readable;
  contentType?: string;
  contentLength?: number;
}

export interface S3ClientLike {
  send(command: any): Promise<any>;
}

export interface StorageService {
  readonly provider: StorageProviderType;
  uploadObject(params: UploadObjectParams): Promise<UploadedObjectResult>;
  getObjectStream(provider: StorageProviderType, key: string): Promise<ObjectStreamResult>;
  getSignedDownloadUrl(
    provider: StorageProviderType,
    key: string,
    originalName?: string,
    asAttachment?: boolean
  ): Promise<string | null>;
  deleteObject(provider: StorageProviderType, key: string): Promise<void>;
}

function buildSafeLocalPath(uploadDir: string, storageKey: string): string {
  const baseDir = path.resolve(uploadDir);
  const cleanKey = path.basename(storageKey);
  const resolved = path.resolve(baseDir, cleanKey);
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    throw new Error('Invalid storage key path traversal attempt.');
  }
  return resolved;
}

export type SignedUrlGenerator = (
  client: S3ClientLike,
  command: GetObjectCommand,
  options: { expiresIn: number }
) => Promise<string>;

export function createStorageService(
  config: Pick<
    EnvConfig,
    | 'STORAGE_PROVIDER'
    | 'UPLOAD_DIR'
    | 'S3_BUCKET'
    | 'S3_REGION'
    | 'S3_ACCESS_KEY_ID'
    | 'S3_SECRET_ACCESS_KEY'
    | 'S3_ENDPOINT'
    | 'S3_FORCE_PATH_STYLE'
    | 'S3_PUBLIC_URL'
    | 'S3_SIGNED_URL_EXPIRES_SEC'
  > = env,
  s3ClientOverride?: S3ClientLike,
  signUrlFn: SignedUrlGenerator = (client, cmd, opts) =>
    getSignedUrl(client as S3Client, cmd, opts)
): StorageService {
  let s3Client: S3ClientLike | null = s3ClientOverride || null;

  function ensureS3Client(): S3ClientLike {
    if (s3Client) return s3Client;
    s3Client = new S3Client({
      region: config.S3_REGION,
      endpoint: config.S3_ENDPOINT || undefined,
      forcePathStyle: config.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY,
      },
    });
    return s3Client;
  }

  return {
    provider: config.STORAGE_PROVIDER,

    async uploadObject({ orgId, projectId, filename, buffer, mimeType }) {
      const safeName = path.basename(filename);

      if (config.STORAGE_PROVIDER === 's3') {
        const key = `orgs/${orgId}/projects/${projectId}/${safeName}`;
        const client = ensureS3Client();
        await client.send(
          new PutObjectCommand({
            Bucket: config.S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
          })
        );
        return { storageProvider: 's3', storageKey: key };
      }

      // Development/Test Local Disk Storage
      await fs.promises.mkdir(config.UPLOAD_DIR, { recursive: true });
      const targetPath = buildSafeLocalPath(config.UPLOAD_DIR, safeName);
      await fs.promises.writeFile(targetPath, buffer);
      return { storageProvider: 'local', storageKey: safeName };
    },

    async getObjectStream(provider, key) {
      if (provider === 's3') {
        if (!config.S3_BUCKET) {
          throw new Error('Cannot retrieve S3 object: S3_BUCKET is not configured.');
        }
        const client = ensureS3Client();
        const result = await client.send(
          new GetObjectCommand({
            Bucket: config.S3_BUCKET,
            Key: key,
          })
        );
        if (!result.Body) {
          throw new Error('Object body is empty in S3 response.');
        }
        const stream =
          result.Body instanceof Readable
            ? result.Body
            : Readable.from(result.Body as AsyncIterable<Uint8Array>);
        return {
          stream,
          contentType: result.ContentType,
          contentLength: result.ContentLength,
        };
      }

      const filePath = buildSafeLocalPath(config.UPLOAD_DIR, key);
      const stat = await fs.promises.stat(filePath);
      return {
        stream: fs.createReadStream(filePath),
        contentLength: stat.size,
      };
    },

    async getSignedDownloadUrl(provider, key, originalName, asAttachment = false) {
      if (provider !== 's3') {
        return null;
      }

      if (config.S3_PUBLIC_URL && !asAttachment) {
        return `${config.S3_PUBLIC_URL}/${key}`;
      }

      if (!config.S3_BUCKET) {
        return null;
      }

      const client = ensureS3Client();
      const safeName = originalName ? path.basename(originalName).replace(/"/g, '') : undefined;
      const command = new GetObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
        ResponseContentDisposition: safeName
          ? `${asAttachment ? 'attachment' : 'inline'}; filename="${safeName}"`
          : undefined,
      });

      return signUrlFn(client, command, {
        expiresIn: config.S3_SIGNED_URL_EXPIRES_SEC,
      });
    },

    async deleteObject(provider, key) {
      if (provider === 's3') {
        const client = ensureS3Client();
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.S3_BUCKET,
            Key: key,
          })
        );
        return;
      }

      const filePath = buildSafeLocalPath(config.UPLOAD_DIR, key);
      await fs.promises.unlink(filePath).catch(() => undefined);
    },
  };
}

export const storageService: StorageService = createStorageService(env);
