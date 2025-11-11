import mongoose from 'mongoose';
import logger from '../utils/logger';
import { config } from './env';

function buildAtlasUri(): string {
  // Prefer a pre-built MONGODB_URI if provided
  if (config.MONGODB_URI && config.MONGODB_URI.startsWith('mongodb')) {
    return config.MONGODB_URI;
  }

  const user = process.env.MONGODB_USER || '';
  const pass = process.env.MONGODB_PASSWORD || '';
  const host = process.env.MONGODB_HOST || 'cluster0.llaom0h.mongodb.net';
  const db = process.env.MONGODB_DB || 'agriconnect';
  const params = process.env.MONGODB_OPTIONS || '?retryWrites=true&w=majority';

  if (!user || !pass) {
    throw new Error('Missing MONGODB_USER or MONGODB_PASSWORD environment variables');
  }

  // encode components to avoid URI injection issues
  const userEnc = encodeURIComponent(user);
  const passEnc = encodeURIComponent(pass);

  return `mongodb+srv://${userEnc}:${passEnc}@${host}/${db}${params}`;
}

export async function connectDatabase(): Promise<mongoose.Connection> {
  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4
    };

    const uri = buildAtlasUri();
    const conn = await mongoose.connect(uri, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    const gracefulClose = async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err: any) {
        logger.error('Error during MongoDB shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', gracefulClose);
    process.on('SIGTERM', gracefulClose);

    return conn.connection;
  } catch (error: any) {
    logger.error('❌ Database connection failed:', error?.message ?? error);
    process.exit(1);
  }
}

export default connectDatabase;