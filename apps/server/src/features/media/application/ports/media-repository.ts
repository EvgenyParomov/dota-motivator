import type { MediaKey, UserId } from '@dm/shared';
import type { MediaEntity } from '../../domain/media.js';

export abstract class MediaRepository {
  abstract create(data: {
    id: string;
    userId: UserId;
    mediaKey: MediaKey;
    mimeType: string;
    size: number;
  }): Promise<MediaEntity>;
}
