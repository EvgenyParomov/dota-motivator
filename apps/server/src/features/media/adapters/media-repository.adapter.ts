import { inject, injectable } from 'inversify';
import type { MediaKey, UserId } from '@dm/shared';
import { DbToken } from '../../../app/tokens.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { media } from '../../../shared/adapters/db/schema/index.js';
import { MediaRepository } from '../application/ports/media-repository.js';
import type { MediaEntity } from '../domain/media.js';

@injectable()
export class DrizzleMediaRepository extends MediaRepository {
  constructor(@inject(DbToken) private readonly db: Db) {
    super();
  }

  override async create(data: {
    id: string;
    userId: UserId;
    mediaKey: MediaKey;
    mimeType: string;
    size: number;
  }): Promise<MediaEntity> {
    const inserted = await this.db.insert(media).values(data).returning();
    const row = inserted[0]!;
    return {
      id: row.id,
      userId: row.userId,
      mediaKey: row.mediaKey,
      mimeType: row.mimeType,
      size: row.size,
      createdAt: row.createdAt,
    };
  }
}
