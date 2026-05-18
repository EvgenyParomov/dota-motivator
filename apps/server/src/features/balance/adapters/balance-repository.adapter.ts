import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { DrizzleTxManager } from '../../../shared/adapters/drizzle-tx-manager.js';
import type { Transaction } from '../../../shared/domain/transaction.js';
import {
  balances,
  balanceEvents,
  lotExecutions,
  lots,
} from '../../../shared/adapters/db/schema/index.js';
import { BalanceRepository } from '../application/ports/balance-repository.js';
import type {
  BalanceCauseKind,
  BalanceEventEntity,
  BalanceEventType,
  NewBalanceEvent,
} from '../domain/balance-event.js';
import { DomainError } from '../../../shared/lib/errors.js';

const toEvent = (
  row: typeof balanceEvents.$inferSelect,
  lotName: string | null = null,
): BalanceEventEntity => ({
  id: row.id,
  userId: row.userId,
  type: row.type as BalanceEventType,
  delta: Number(row.delta),
  causeKind: row.causeKind as BalanceCauseKind,
  causeId: row.causeId,
  description: row.description,
  createdAt: row.createdAt,
  lotName,
});

class BalanceRowMissingError extends DomainError {
  constructor(userId: UserId) {
    super('NOT_FOUND', `balance row missing for user ${userId}`);
  }
}

@injectable()
export class DrizzleBalanceRepository extends BalanceRepository {
  constructor(@inject(DrizzleTxManager) private readonly txManager: DrizzleTxManager) {
    super();
  }

  override async createIfMissing(userId: UserId): Promise<void> {
    await this.txManager
      .resolve()
      .insert(balances)
      .values({ userId, balance: '0' })
      .onConflictDoNothing({ target: balances.userId });
  }

  override async getBalance(userId: UserId): Promise<number> {
    const rows = await this.txManager
      .resolve()
      .select()
      .from(balances)
      .where(eq(balances.userId, userId))
      .limit(1);
    const row = rows[0];
    return row ? Number(row.balance) : 0;
  }

  override async incrementBalance(
    userId: UserId,
    delta: number,
    tx?: Transaction,
  ): Promise<void> {
    const updated = await this.txManager
      .resolve(tx)
      .update(balances)
      .set({
        balance: sql`${balances.balance} + ${delta}`,
        updatedAt: sql`now()`,
      })
      .where(eq(balances.userId, userId))
      .returning({ userId: balances.userId });
    if (updated.length === 0) {
      throw new BalanceRowMissingError(userId);
    }
  }

  override async insertEvent(
    event: NewBalanceEvent,
    tx?: Transaction,
  ): Promise<BalanceEventEntity> {
    const inserted = await this.txManager
      .resolve(tx)
      .insert(balanceEvents)
      .values({
        id: event.id,
        userId: event.userId,
        type: event.type,
        delta: String(event.delta),
        causeKind: event.causeKind,
        causeId: event.causeId,
        description: event.description,
      })
      .returning();
    return toEvent(inserted[0]!);
  }

  override async listEvents(
    userId: UserId,
    range?: { from?: Date; to?: Date },
  ): Promise<BalanceEventEntity[]> {
    const conds = [eq(balanceEvents.userId, userId)];
    if (range?.from) conds.push(gte(balanceEvents.createdAt, range.from));
    if (range?.to) conds.push(lte(balanceEvents.createdAt, range.to));
    const rows = await this.txManager
      .resolve()
      .select({ event: balanceEvents, lotName: lots.name })
      .from(balanceEvents)
      .leftJoin(lotExecutions, eq(balanceEvents.causeId, lotExecutions.id))
      .leftJoin(lots, eq(lotExecutions.lotId, lots.id))
      .where(and(...conds))
      .orderBy(asc(balanceEvents.createdAt));
    return rows.map((r) => toEvent(r.event, r.lotName));
  }
}
