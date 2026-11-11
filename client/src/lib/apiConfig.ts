export const TOKEN_STORAGE_KEY = 'amendflow_auth_token';

/**
 * Resolves the configured backend origin from Vite environment variables.
 * Returns '' in local dev proxy mode so relative /api and /uploads paths work.
 */
export function resolveBackendOrigin(rawApiUrl?: string): string {
  const configured =
    rawApiUrl ??
    (typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || ''
      : '');

  const trimmed = String(configured || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  // Support users passing either https://api.example.com OR https://api.example.com/api
  return trimmed.replace(/\/api$/i, '');
}

/**
 * Resolves Axios API baseURL (either https://<backend>/api or relative /api).
 */
export function resolveApiBaseUrl(rawApiUrl?: string): string {
  const origin = resolveBackendOrigin(rawApiUrl);
  return origin ? `${origin}/api` : '/api';
}

export interface DocumentUrlInput {
  _id?: string;
  fileUrl?: string;
  downloadUrl?: string;
  storagePath?: string;
}

/**
 * Resolves an uploaded document URL for both same-origin local proxy
 * and separate frontend/backend deployments (absolute S3 signed URL or backend /api/documents/:id/file).
 */
export function resolveUploadedDocumentUrl(
  docOrPath: string | DocumentUrlInput | null | undefined,
  rawApiUrl?: string,
  preferDownload: boolean = false
): string {
  if (!docOrPath) return '';

  let candidate = '';
  if (typeof docOrPath === 'string') {
    candidate = docOrPath.trim();
  } else {
    candidate = (
      (preferDownload ? docOrPath.downloadUrl : undefined) ||
      docOrPath.fileUrl ||
      docOrPath.storagePath ||
      (docOrPath._id ? `/api/documents/${docOrPath._id}/file` : '')
    ).trim();
  }

  if (!candidate) return '';

  // Already an absolute URL (e.g., S3 presigned URL, CDN URL, or full backend URL)
  if (/^(https?:\/\/|blob:|data:)/i.test(candidate)) {
    return candidate;
  }

  const normalizedPath = candidate.startsWith('/') ? candidate : `/${candidate}`;
  const origin = resolveBackendOrigin(rawApiUrl);
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}

export function getStoredAuthToken(): string | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage.getItem(TOKEN_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors in restricted frames
  }
}
