import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { ProfileRepository } from '../ports/profile-repository.js';
import { BalanceInitializer } from '../../../../shared/application/ports/balance-initializer.js';
import { BalanceMutator } from '../../../../shared/application/ports/balance-mutator.js';
import {
  validateDebtThreshold,
  validateStartingBalance,
} from '../../domain/profile.js';
import { ConflictError, NotFoundError } from '../../../../shared/lib/errors.js';

@injectable()
export class CompleteOnboardingUseCase {
  constructor(
    @inject(ProfileRepository) private readonly profiles: ProfileRepository,
    @inject(BalanceInitializer) private readonly balanceInit: BalanceInitializer,
    @inject(BalanceMutator) private readonly balanceMutator: BalanceMutator,
  ) {}

  async execute(
    userId: UserId,
    params: { debtThreshold: number; startingBalance: number },
  ): Promise<void> {
    validateDebtThreshold(params.debtThreshold);
    validateStartingBalance(params.startingBalance);

    const profile = await this.profiles.findByUserId(userId);
    if (!profile) throw new NotFoundError('profile');
    if (profile.onboardingCompleted) {
      throw new ConflictError('onboarding already completed');
    }

    await this.balanceInit.initialize(userId);
    await this.profiles.updateDebtThreshold(userId, params.debtThreshold);
    if (params.startingBalance > 0) {
      await this.balanceMutator.credit(userId, params.startingBalance, {
        kind: 'initial-deposit',
      });
    } else if (params.startingBalance < 0) {
      await this.balanceMutator.debit(userId, -params.startingBalance, {
        kind: 'initial-deposit',
      });
    }
    await this.profiles.markOnboardingCompleted(userId);
  }
}
