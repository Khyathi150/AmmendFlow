import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

const server = http.createServer(app);

// Initialize Socket.IO with CORS
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Allow joining rooms scoped by organization or project
  socket.on('join_org', (orgId: string) => {
    socket.join(`org_${orgId}`);
    console.log(`[Socket.IO] Socket ${socket.id} joined room org_${orgId}`);
  });

  socket.on('join_project', (projectId: string) => {
    socket.join(`project_${projectId}`);
    console.log(`[Socket.IO] Socket ${socket.id} joined room project_${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

async function startServer() {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 AmendFlow API Server is running on port ${env.PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

