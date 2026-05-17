import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { BalanceReader } from '../../../../shared/application/ports/balance-reader.js';

export type PlayDecision =
  | { allowed: true; balance: number; debtThreshold: number }
  | { allowed: false; reason: string; balance: number; debtThreshold: number };

@injectable()
export class CheckPlayDecisionUseCase {
  constructor(@inject(BalanceReader) private readonly balance: BalanceReader) {}

  async execute(userId: UserId): Promise<PlayDecision> {
    const view = await this.balance.read(userId);
    if (view.canPlayMore) {
      return { allowed: true, balance: view.balance, debtThreshold: view.debtThreshold };
    }
    return {
      allowed: false,
      reason: `Баланс ${view.balance}, порог долга ${view.debtThreshold}. Сначала выполни лот.`,
      balance: view.balance,
      debtThreshold: view.debtThreshold,
    };
  }
}
