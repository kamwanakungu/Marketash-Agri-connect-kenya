import 'dotenv/config';
import express from 'express';
import connectDB from './config/db';
import logger from './utils/logger';
import { config } from './config/env';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = config.PORT || 5000;

// Load environment variables
config();

// Connect to the database
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use(`/api/${process.env.API_VERSION}`, routes);

// Start the server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${config.API_VERSION}`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default startServer;