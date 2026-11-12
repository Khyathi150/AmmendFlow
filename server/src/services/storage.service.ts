import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { v2 as cloudinaryV2 } from 'cloudinary';
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
  storageUrl?: string;
  resourceType?: string;
}

export interface ObjectStreamResult {
  stream: Readable;
  contentType?: string;
  contentLength?: number;
}

export interface StorageLookupOptions {
  storageUrl?: string;
  resourceType?: string;
}

export interface CloudinaryAdapter {
  uploadBuffer(params: {
    buffer: Buffer;
    folder: string;
    publicId: string;
  }): Promise<{ public_id: string; secure_url: string; resource_type?: string }>;
  buildUrl(
    publicId: string,
    options?: { resourceType?: string; asAttachment?: boolean }
  ): string;
  destroy(publicId: string, resourceType?: string): Promise<void>;
}

export type FetchFn = (url: string) => Promise<Response>;

export interface StorageService {
  readonly provider: StorageProviderType;
  uploadObject(params: UploadObjectParams): Promise<UploadedObjectResult>;
  getObjectStream(
    provider: StorageProviderType,
    key: string,
    options?: StorageLookupOptions
  ): Promise<ObjectStreamResult>;
  getDownloadUrl(
    provider: StorageProviderType,
    key: string,
    asAttachment?: boolean,
    options?: StorageLookupOptions
  ): Promise<string | null>;
  deleteObject(
    provider: StorageProviderType,
    key: string,
    options?: StorageLookupOptions
  ): Promise<void>;
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

function buildCloudinaryPublicId(filename: string, mimeType: string): string {
  const safeName = path.basename(filename);
  const isImageOrPdf = mimeType.startsWith('image/') || mimeType === 'application/pdf';
  return isImageOrPdf ? path.parse(safeName).name : safeName;
}

export function createCloudinaryAdapter(
  config: Pick<
    EnvConfig,
    'CLOUDINARY_CLOUD_NAME' | 'CLOUDINARY_API_KEY' | 'CLOUDINARY_API_SECRET'
  >
): CloudinaryAdapter {
  cloudinaryV2.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return {
    uploadBuffer({ buffer, folder, publicId }) {
      return new Promise((resolve, reject) => {
        const stream = cloudinaryV2.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Cloudinary upload did not return a result.'));
            }
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              resource_type: result.resource_type,
            });
          }
        );

        Readable.from(buffer).pipe(stream);
      });
    },

    buildUrl(publicId, options) {
      return cloudinaryV2.url(publicId, {
        secure: true,
        sign_url: true,
        resource_type: (options?.resourceType as any) || 'image',
        flags: options?.asAttachment ? 'attachment' : undefined,
      });
    },

    async destroy(publicId, resourceType) {
      await cloudinaryV2.uploader.destroy(publicId, {
        resource_type: (resourceType as any) || 'image',
        invalidate: true,
      });
    },
  };
}

export function createStorageService(
  config: Pick<
    EnvConfig,
    | 'STORAGE_PROVIDER'
    | 'UPLOAD_DIR'
    | 'CLOUDINARY_CLOUD_NAME'
    | 'CLOUDINARY_API_KEY'
    | 'CLOUDINARY_API_SECRET'
    | 'CLOUDINARY_FOLDER'
  > = env,
  cloudinaryOverride?: CloudinaryAdapter,
  fetchFn: FetchFn = fetch
): StorageService {
  let cloudinaryAdapter: CloudinaryAdapter | null = cloudinaryOverride || null;

  function ensureCloudinary(): CloudinaryAdapter {
    if (cloudinaryAdapter) return cloudinaryAdapter;
    if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
      throw new Error('Cannot access Cloudinary storage: Cloudinary backend credentials are not configured.');
    }
    cloudinaryAdapter = createCloudinaryAdapter(config);
    return cloudinaryAdapter;
  }

  return {
    provider: config.STORAGE_PROVIDER,

    async uploadObject({ orgId, projectId, filename, buffer, mimeType }) {
      const safeName = path.basename(filename);

      if (config.STORAGE_PROVIDER === 'cloudinary') {
        const client = ensureCloudinary();
        const folder = `${config.CLOUDINARY_FOLDER || 'amendflow'}/orgs/${orgId}/projects/${projectId}`;
        const publicId = buildCloudinaryPublicId(safeName, mimeType);

        const uploaded = await client.uploadBuffer({
          buffer,
          folder,
          publicId,
        });

        return {
          storageProvider: 'cloudinary',
          storageKey: uploaded.public_id,
          storageUrl: uploaded.secure_url,
          resourceType: uploaded.resource_type,
        };
      }

      // Development/Test Local Disk Storage
      await fs.promises.mkdir(config.UPLOAD_DIR, { recursive: true });
      const targetPath = buildSafeLocalPath(config.UPLOAD_DIR, safeName);
      await fs.promises.writeFile(targetPath, buffer);
      return { storageProvider: 'local', storageKey: safeName };
    },

    async getObjectStream(provider, key, options) {
      if (provider === 'cloudinary') {
        const targetUrl =
          options?.storageUrl ||
          ensureCloudinary().buildUrl(key, {
            resourceType: options?.resourceType,
          });

        const response = await fetchFn(targetUrl);
        if (response.status === 404) {
          const err: any = new Error('NoSuchKey');
          err.name = 'NoSuchKey';
          throw err;
        }
        if (!response.ok || !response.body) {
          throw new Error(`Failed to fetch Cloudinary asset (${response.status}).`);
        }

        const contentLengthHeader = response.headers.get('content-length');
        const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : undefined;
        const stream = Readable.fromWeb(response.body as any);

        return {
          stream,
          contentType: response.headers.get('content-type') || undefined,
          contentLength: Number.isFinite(contentLength) ? contentLength : undefined,
        };
      }

      const filePath = buildSafeLocalPath(config.UPLOAD_DIR, key);
      const stat = await fs.promises.stat(filePath);
      return {
        stream: fs.createReadStream(filePath),
        contentLength: stat.size,
      };
    },

    async getDownloadUrl(provider, key, asAttachment = false, options) {
      if (provider !== 'cloudinary') {
        return null;
      }

      if (options?.storageUrl && !asAttachment) {
        return options.storageUrl;
      }

      return ensureCloudinary().buildUrl(key, {
        resourceType: options?.resourceType,
        asAttachment,
      });
    },

    async deleteObject(provider, key, options) {
      if (provider === 'cloudinary') {
        await ensureCloudinary().destroy(key, options?.resourceType);
        return;
      }

      const filePath = buildSafeLocalPath(config.UPLOAD_DIR, key);
      await fs.promises.unlink(filePath).catch(() => undefined);
    },
  };
}

export const storageService: StorageService = createStorageService(env);
