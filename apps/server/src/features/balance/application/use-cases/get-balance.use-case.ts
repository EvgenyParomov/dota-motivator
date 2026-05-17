import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { BalanceRepository } from '../ports/balance-repository.js';
import { ProfileReader } from '../../../../shared/application/ports/profile-reader.js';
import { canPlayMore } from '../../domain/balance.js';

export type BalanceView = {
  balance: number;
  debtThreshold: number;
  canPlayMore: boolean;
};

@injectable()
export class GetBalanceUseCase {
  constructor(
    @inject(BalanceRepository) private readonly repo: BalanceRepository,
    @inject(ProfileReader) private readonly profile: ProfileReader,
  ) {}

  async execute(userId: UserId): Promise<BalanceView> {
    const [balance, debtThreshold] = await Promise.all([
      this.repo.getBalance(userId),
      this.profile.readDebtThreshold(userId),
    ]);
    return {
      balance,
      debtThreshold,
      canPlayMore: canPlayMore(balance, debtThreshold),
    };
  }
}
