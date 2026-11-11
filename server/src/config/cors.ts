import type { CorsOptions } from 'cors';
import { env, EnvConfig } from './env.js';

function stripTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function isOriginAllowed(
  origin: string | undefined,
  config: Pick<EnvConfig, 'NODE_ENV' | 'CLIENT_URL'> = env
): boolean {
  // Non-browser clients (curl, server health checks, supertest) omit the Origin header.
  if (!origin) {
    return true;
  }

  const normalizedOrigin = stripTrailingSlash(origin);
  const exactClientUrl = stripTrailingSlash(config.CLIENT_URL);

  if (config.NODE_ENV === 'production') {
    return normalizedOrigin === exactClientUrl;
  }

  // Non-production: allow exact CLIENT_URL and local loopback dev origins only (never allow-all)
  if (normalizedOrigin === exactClientUrl) {
    return true;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin);
}

export function createCorsOptions(
  config: Pick<EnvConfig, 'NODE_ENV' | 'CLIENT_URL'> = env
): CorsOptions {
  return {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, config)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
}
