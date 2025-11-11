import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  logger.info(`Connecting to MongoDB: ${uri ? uri.replace(/:[^:@]+@/, ':<REDACTED>@') : 'MISSING'}`);

  if (!uri) {
    // Fail fast with clear message so TypeScript knows uri is present after this guard
    throw new Error('MONGODB_URI is not set in environment (check backend/.env)');
  }

  const options: mongoose.ConnectOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
  };

  try {
    await mongoose.connect(uri, options);
    logger.info('✅ MongoDB connected', {
      host: mongoose.connection.host,
      db: mongoose.connection.name
    });
  } catch (err: any) {
    logger.error('MongoDB connection error', { message: err?.message, name: err?.name });
    throw err;
  }

  mongoose.connection.on('connected', () => logger.info('Mongoose event: connected'));
  mongoose.connection.on('reconnected', () => logger.info('Mongoose event: reconnected'));
  mongoose.connection.on('error', (err) => logger.error('Mongoose event: error', err));
  mongoose.connection.on('disconnected', () => logger.warn('Mongoose event: disconnected'));

  const gracefulClose = async (signal: string) => {
    try {
      await mongoose.connection.close();
      logger.info(`MongoDB connection closed (${signal})`);
      process.exit(0);
    } catch (closeErr) {
      logger.error('Error closing MongoDB connection', closeErr);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulClose('SIGINT'));
  process.on('SIGTERM', () => gracefulClose('SIGTERM'));
};

export default connectDB;