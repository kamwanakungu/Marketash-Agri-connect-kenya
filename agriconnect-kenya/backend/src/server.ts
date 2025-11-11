import express from 'express';
import { connectDB } from './config/database';
import { config } from './config/env';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();

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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});