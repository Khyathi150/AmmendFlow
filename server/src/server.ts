import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocketIO } from './config/socket.js';

const server = http.createServer(app);

// Initialize authenticated & membership-verified Socket.IO server
export const io = initSocketIO(server, env);

async function startServer() {
  try {
    await connectDB();

    server.listen(env.PORT, env.HOST, () => {
      console.log(`====================================================`);
      console.log(`AmendFlow API Server is running on ${env.HOST}:${env.PORT}`);
      console.log(`  Environment:      ${env.NODE_ENV}`);
      console.log(`  Allowed Client:   ${env.CLIENT_URL}`);
      console.log(`  Storage Provider: ${env.STORAGE_PROVIDER}`);
      console.log(`  Health Check:     http://${env.HOST}:${env.PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
