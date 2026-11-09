import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';

let mongodInstance: MongoMemoryServer | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[Database] Connecting to MongoDB at ${uri.replace(/\/\/.*@/, '//<credentials>@')}...`);
      const conn = await mongoose.connect(uri, {
        autoIndex: true,
      });
      console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[Database] Failed to connect to configured MONGODB_URI. Falling back to embedded MongoMemoryServer...`, err);
    }
  }

  // Start embedded in-memory MongoDB instance for seamless zero-config operation
  console.log('[Database] Starting embedded MongoDB Memory Server for local development/testing...');
  mongodInstance = await MongoMemoryServer.create({
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

