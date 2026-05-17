import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { ProfileInitializer } from '../../../../shared/application/ports/profile-initializer.js';
import { ProfileRepository } from '../ports/profile-repository.js';

@injectable()
export class ProfileInitializerService extends ProfileInitializer {
  constructor(@inject(ProfileRepository) private readonly repo: ProfileRepository) {
    super();
  }

  override async initialize(userId: UserId): Promise<void> {
    await this.repo.createIfMissing(userId);
  }
}
