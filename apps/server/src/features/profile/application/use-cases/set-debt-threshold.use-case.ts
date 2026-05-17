import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { ProfileRepository } from '../ports/profile-repository.js';
import { validateDebtThreshold } from '../../domain/profile.js';

@injectable()
export class SetDebtThresholdUseCase {
  constructor(@inject(ProfileRepository) private readonly repo: ProfileRepository) {}

  async execute(userId: UserId, debtThreshold: number): Promise<void> {
    validateDebtThreshold(debtThreshold);
    await this.repo.updateDebtThreshold(userId, debtThreshold);
  }
}
