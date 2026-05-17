import { inject, injectable } from 'inversify';
import type { Client as MinioClient } from 'minio';
import type { MediaKey } from '@dm/shared';
import { MediaPresigner } from '../application/ports/media-presigner.js';
import { MinioBucketToken, MinioToken } from '../../../shared/adapters/minio.js';

const PUT_URL_TTL_SECONDS = 60 * 10;

@injectable()
export class MinioMediaPresigner extends MediaPresigner {
  constructor(
    @inject(MinioToken) private readonly client: MinioClient,
    @inject(MinioBucketToken) private readonly bucket: string,
  ) {
    super();
  }

  override async presignPut(key: MediaKey, _mimeType: string): Promise<string> {
    return this.client.presignedPutObject(this.bucket, key, PUT_URL_TTL_SECONDS);
  }
}
