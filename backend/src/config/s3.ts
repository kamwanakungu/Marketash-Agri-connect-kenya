import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env';

const s3 = new S3Client({
  region: config.AWS.REGION,
  credentials:
    config.AWS.ACCESS_KEY_ID && config.AWS.SECRET_ACCESS_KEY
      ? {
          accessKeyId: config.AWS.ACCESS_KEY_ID,
          secretAccessKey: config.AWS.SECRET_ACCESS_KEY
        }
      : undefined
});

export default s3;