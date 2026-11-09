import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { sendError } from './utils/responseEnvelope.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import boqRoutes from './routes/boq.routes.js';
import changeOrderRoutes from './routes/changeOrder.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import financialExposureRoutes from './routes/financialExposure.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import documentRoutes from './routes/document.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();

// Ensure uploads directory exists
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // relaxed for local development assets & pdf.js
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      // In development, allow localhost origins
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      if (origin === env.CLIENT_URL) {
        return callback(null, true);
      }
      return callback(null, true); // Dev convenience
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file hosting for uploaded attachments
app.use('/uploads', express.static(env.UPLOAD_DIR));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AmendFlow Core API',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', boqRoutes);
app.use('/api/change-orders', changeOrderRoutes);
app.use('/api/change-orders', approvalRoutes);
app.use('/api/financial-exposure', financialExposureRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);

// Catch-all 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  sendError(res, 'NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[GlobalErrorHandler]', err);

  if (err.name === 'ValidationError') {
    return sendError(res, 'VALIDATION_ERROR', err.message, 400, err.errors);
  }

  if (err.name === 'CastError') {
    return sendError(res, 'INVALID_IDENTIFIER', `Invalid ID format for ${err.path}`, 400);
  }

  return sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message || 'Internal Error',
    500
  );
});

export default app;
