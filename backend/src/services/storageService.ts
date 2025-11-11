import { S3 } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

const s3 = new S3({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

class StorageService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileStream = Readable.from(file.buffer);
    const uploadParams = {
      Bucket: config.S3_BUCKET_NAME,
      Body: fileStream,
      Key: `${uuidv4()}-${file.originalname}`,
      ContentType: file.mimetype,
    };

    const { Location } = await s3.upload(uploadParams).promise();
    return Location;
  }

  async deleteFile(fileKey: string): Promise<void> {
    const deleteParams = {
      Bucket: config.S3_BUCKET_NAME,
      Key: fileKey,
    };

    await s3.deleteObject(deleteParams).promise();
  }
}

export default new StorageService();