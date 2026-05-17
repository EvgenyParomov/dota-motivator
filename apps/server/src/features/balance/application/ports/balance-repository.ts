import type { UserId } from '@dm/shared';
import type { Transaction } from '../../../../shared/domain/transaction.js';
import type {
  BalanceEventEntity,
  NewBalanceEvent,
} from '../../domain/balance-event.js';

export abstract class BalanceRepository {
  abstract createIfMissing(userId: UserId): Promise<void>;
  abstract getBalance(userId: UserId): Promise<number>;

  abstract incrementBalance(userId: UserId, delta: number, tx?: Transaction): Promise<void>;
  abstract insertEvent(event: NewBalanceEvent, tx?: Transaction): Promise<BalanceEventEntity>;

  abstract listEvents(
    userId: UserId,
    range?: { from?: Date; to?: Date },
  ): Promise<BalanceEventEntity[]>;
}
