import { Client as MinioClient } from 'minio';

export type MinioConfig = {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
};

export const buildMinio = (cfg: MinioConfig): MinioClient =>
  new MinioClient({
    endPoint: cfg.endPoint,
    port: cfg.port,
    useSSL: cfg.useSSL,
    accessKey: cfg.accessKey,
    secretKey: cfg.secretKey,
  });

export const ensureBucket = async (client: MinioClient, bucket: string): Promise<void> => {
  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket);
  }
};

export const MinioToken = Symbol.for('MinioClient');
export const MinioBucketToken = Symbol.for('MinioBucket');
