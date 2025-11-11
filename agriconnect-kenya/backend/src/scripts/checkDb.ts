import 'dotenv/config';
import mongoose from 'mongoose';
import connectDatabase from '../config/database';
import logger from '../utils/logger';

(async () => {
  try {
    const conn = await connectDatabase();
    logger.info('✅ Mongoose readyState: %d (1=connected)', mongoose.connection.readyState);
    logger.info('📍 Mongo host: %s  |  DB: %s', conn.host, conn.name);
    // Close connection after check
    await mongoose.connection.close();
    logger.info('🔌 Connection closed');
    process.exit(0);
  } catch (err: any) {
    logger.error('❌ DB check failed:', err?.message ?? err);
    process.exit(1);
  }
})();