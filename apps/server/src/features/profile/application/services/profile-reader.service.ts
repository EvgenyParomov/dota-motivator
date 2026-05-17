import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { ProfileReader } from '../../../../shared/application/ports/profile-reader.js';
import type { ProfileSnapshot } from '../../../../shared/domain/profile.js';
import { ProfileRepository } from '../ports/profile-repository.js';

@injectable()
export class ProfileReaderService extends ProfileReader {
  constructor(@inject(ProfileRepository) private readonly repo: ProfileRepository) {
    super();
  }

  override async read(userId: UserId): Promise<ProfileSnapshot | null> {
    return this.repo.findByUserId(userId);
  }

  override async readDebtThreshold(userId: UserId): Promise<number> {
    const p = await this.repo.findByUserId(userId);
    return p?.debtThreshold ?? 0;
  }
}
