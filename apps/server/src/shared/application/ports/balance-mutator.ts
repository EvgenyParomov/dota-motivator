import type { UserId } from '@dm/shared';
import type { CreditCause, DebitCause } from '../../domain/balance.js';

export abstract class BalanceMutator {
  abstract credit(userId: UserId, amount: number, cause: CreditCause): Promise<void>;
  abstract debit(userId: UserId, amount: number, cause: DebitCause): Promise<void>;
}
