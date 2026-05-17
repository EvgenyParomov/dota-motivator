import { inject, injectable } from 'inversify';
import type { Client as MinioClient } from 'minio';
import type { MediaKey } from '@dm/shared';
import { MediaUrlResolver } from '../../../shared/application/ports/media-url-resolver.js';
import { MinioToken, MinioBucketToken } from '../../../shared/adapters/minio.js';

const READ_URL_TTL_SECONDS = 60 * 60;

@injectable()
export class MinioMediaUrlResolver extends MediaUrlResolver {
  constructor(
    @inject(MinioToken) private readonly client: MinioClient,
    @inject(MinioBucketToken) private readonly bucket: string,
  ) {
    super();
  }

  override async resolveReadUrl(key: MediaKey | null): Promise<string | null> {
    if (!key) return null;
    return this.client.presignedGetObject(this.bucket, key, READ_URL_TTL_SECONDS);
  }
}
