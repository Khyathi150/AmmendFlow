import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { env, EnvConfig } from './env.js';

let mongodInstance: MongoMemoryServer | null = null;

export async function connectDB(config: Pick<EnvConfig, 'MONGODB_URI' | 'NODE_ENV'> = env): Promise<typeof mongoose> {
  const uri = config.MONGODB_URI?.trim() || '';
  const isProd = config.NODE_ENV === 'production';

  if (uri !== '') {
    console.log(`[Database] Connecting to MongoDB at ${uri.replace(/\/\/.*@/, '//<credentials>@')}...`);
    try {
      const conn = await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      // Never silently fall back to MongoMemoryServer when an explicit URI fails.
      console.error('[Database] FATAL: Failed to connect to configured MONGODB_URI.', err);
      throw err;
    }
  }

  if (isProd) {
    throw new Error(
      '[Database] FATAL: MONGODB_URI must be configured in production. Embedded MongoMemoryServer fallback is disabled.'
    );
  }

  // Start embedded in-memory MongoDB instance ONLY in non-production environments when MONGODB_URI is unset
  console.log('[Database] Starting embedded MongoDB Memory Server for local development/testing...');
  const { MongoMemoryServer: MemoryServer } = await import('mongodb-memory-server');
  mongodInstance = await MemoryServer.create({
    instance: {
      dbName: 'amendflow_dev',
    },
  });

  const memoryUri = mongodInstance.getUri();
  console.log(`[Database] Embedded MongoDB Memory Server started at: ${memoryUri}`);

  const conn = await mongoose.connect(memoryUri, {
    autoIndex: true,
  });
  console.log('[Database] Embedded MongoDB connected successfully.');
  return conn;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
  console.log('[Database] Disconnected from MongoDB.');
}
