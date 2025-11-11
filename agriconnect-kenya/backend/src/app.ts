import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import connectDatabase from './config/database';
import redis from './config/redis';
import logger from './utils/logger';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import listingRoutes from './routes/listing.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security & middleware
app.use(helmet());
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: (redis && (redis.status ?? 'unknown')) as string
  };
  res.status(200).json(health);
});

// Simple test route
app.get(`/api/${config.API_VERSION}/test`, (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'AgriConnect Kenya API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use(`/api/${config.API_VERSION}/auth`, authRoutes);
app.use(`/api/${config.API_VERSION}/users`, userRoutes);
app.use(`/api/${config.API_VERSION}/listings`, listingRoutes);
app.use(`/api/${config.API_VERSION}/orders`, orderRoutes);
app.use(`/api/${config.API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${config.API_VERSION}/admin`, adminRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', {
    message: err?.message,
    stack: err?.stack,
    path: _req.path
  });

  res.status(err?.statusCode || 500).json({
    success: false,
    message: err?.message || 'Internal server error',
    ...(config.NODE_ENV === 'development' && { stack: err?.stack })
  });
});

const PORT = config.PORT || 5000;

export const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${config.API_VERSION}`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start when running directly
if (require.main === module) {
  startServer();
}

export default app;