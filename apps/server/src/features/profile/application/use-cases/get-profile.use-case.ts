import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { ProfileRepository } from '../ports/profile-repository.js';
import type { ProfileEntity } from '../../domain/profile.js';
import { NotFoundError } from '../../../../shared/lib/errors.js';

@injectable()
export class GetProfileUseCase {
  constructor(@inject(ProfileRepository) private readonly repo: ProfileRepository) {}

  async execute(userId: UserId): Promise<ProfileEntity> {
    const p = await this.repo.findByUserId(userId);
    if (!p) throw new NotFoundError('profile');
    return p;
  }
}
