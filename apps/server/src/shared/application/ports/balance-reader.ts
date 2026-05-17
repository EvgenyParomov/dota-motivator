import type { UserId } from '@dm/shared';
import type { BalanceSnapshot } from '../../domain/balance.js';

export abstract class BalanceReader {
  abstract read(userId: UserId): Promise<BalanceSnapshot>;
}
