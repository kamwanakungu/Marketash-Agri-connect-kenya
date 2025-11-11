import Redis from 'ioredis';
import { config } from './env';

const redisUrl = config.REDIS_URL;
export const redis = new Redis(redisUrl);

redis.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log('🔁 Connected to Redis');
  }
});
redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Redis error:', err);
});

export default redis;