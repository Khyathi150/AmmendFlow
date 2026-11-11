import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import { env, EnvConfig } from './config/env.js';
import { createCorsOptions } from './config/cors.js';
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

export function createApp(config: Pick<EnvConfig, 'NODE_ENV' | 'CLIENT_URL' | 'STORAGE_PROVIDER' | 'UPLOAD_DIR'> = env) {
  const app = express();

  // Respect reverse proxy headers (X-Forwarded-Proto, X-Forwarded-For) in hosted deployments
  app.set('trust proxy', 1);

  // Only ensure local upload folder when local disk storage is configured
  if (config.STORAGE_PROVIDER === 'local' && !fs.existsSync(config.UPLOAD_DIR)) {
    fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
  }

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Strict CORS policy restricted to CLIENT_URL in production (no allow-all fallback)
  app.use(cors(createCorsOptions(config)));

  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Local disk static hosting ONLY in development/test local storage mode
  if (config.STORAGE_PROVIDER === 'local') {
    app.use('/uploads', express.static(config.UPLOAD_DIR));
  }

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AmendFlow Core API',
      version: '1.0.0',
      storageProvider: config.STORAGE_PROVIDER,
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
      config.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message || 'Internal Error',
      500
    );
  });

  return app;
}

const app = createApp(env);
export default app;
