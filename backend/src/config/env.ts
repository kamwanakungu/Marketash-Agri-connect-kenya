import dotenv from 'dotenv';
dotenv.config();

const get = (k: string, fallback?: string) => process.env[k] ?? fallback;

export const config = {
  NODE_ENV: get('NODE_ENV', 'development'),
  PORT: Number(get('PORT', '5000')),
  API_VERSION: get('API_VERSION', 'v1'),

  MONGODB_URI: get('MONGODB_URI', 'mongodb://localhost:27017/agriconnect'),
  MONGODB_TEST_URI: get('MONGODB_TEST_URI', 'mongodb://localhost:27017/agriconnect_test'),

  REDIS_URL: get('REDIS_URL', 'redis://localhost:6379'),

  JWT_ACCESS_SECRET: get('JWT_ACCESS_SECRET', ''),
  JWT_REFRESH_SECRET: get('JWT_REFRESH_SECRET', ''),
  JWT_ACCESS_EXPIRY: get('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_EXPIRY: get('JWT_REFRESH_EXPIRY', '7d'),

  ENCRYPTION_KEY: get('ENCRYPTION_KEY', ''),

  MPESA: {
    ENVIRONMENT: get('MPESA_ENVIRONMENT', 'sandbox'),
    CONSUMER_KEY: get('MPESA_CONSUMER_KEY', ''),
    CONSUMER_SECRET: get('MPESA_CONSUMER_SECRET', ''),
    SHORTCODE: get('MPESA_SHORTCODE', ''),
    PASSKEY: get('MPESA_PASSKEY', ''),
    CALLBACK_URL: get('MPESA_CALLBACK_URL', ''),
    B2C_SHORTCODE: get('MPESA_B2C_SHORTCODE', ''),
    B2C_INITIATOR: get('MPESA_B2C_INITIATOR', ''),
    B2C_SECURITY_CREDENTIAL: get('MPESA_B2C_SECURITY_CREDENTIAL', '')
  },

  AT: {
    USERNAME: get('AT_USERNAME', 'sandbox'),
    API_KEY: get('AT_API_KEY', ''),
    SENDER_ID: get('AT_SENDER_ID', 'AGRICONNECT')
  },

  AWS: {
    REGION: get('AWS_REGION', 'us-east-1'),
    ACCESS_KEY_ID: get('AWS_ACCESS_KEY_ID', ''),
    SECRET_ACCESS_KEY: get('AWS_SECRET_ACCESS_KEY', ''),
    S3_BUCKET_NAME: get('S3_BUCKET_NAME', '')
  },

  GOOGLE_MAPS_API_KEY: get('GOOGLE_MAPS_API_KEY', ''),

  ELASTICSEARCH_NODE: get('ELASTICSEARCH_NODE', 'http://localhost:9200'),

  FRONTEND_URL: get('FRONTEND_URL', 'http://localhost:5173'),

  RATE_LIMIT_WINDOW_MS: Number(get('RATE_LIMIT_WINDOW_MS', '900000')),
  RATE_LIMIT_MAX_REQUESTS: Number(get('RATE_LIMIT_MAX_REQUESTS', '100')),

  LOG_LEVEL: get('LOG_LEVEL', 'info')
} as const;