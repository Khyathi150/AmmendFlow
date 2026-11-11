import axios from 'axios';
import { resolveApiBaseUrl, getStoredAuthToken } from './apiConfig';

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network communication error',
    };
    return Promise.reject(customError);
  }
);

export async function downloadAuthenticatedFile(
  apiPath: string,
  fallbackFilename: string
): Promise<void> {
  const blobData: any = await api.get(apiPath, { responseType: 'blob' });
  const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fallbackFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
