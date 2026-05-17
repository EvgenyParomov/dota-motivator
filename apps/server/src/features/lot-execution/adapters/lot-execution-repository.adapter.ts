import { and, desc, eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import type { LotExecutionId, LotId, UserId } from '@dm/shared';
import { DbToken } from '../../../app/tokens.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { lotExecutions } from '../../../shared/adapters/db/schema/index.js';
import { LotExecutionRepository } from '../application/ports/lot-execution-repository.js';
import type { LotExecutionEntity } from '../domain/lot-execution.js';

const toEntity = (row: typeof lotExecutions.$inferSelect): LotExecutionEntity => ({
  id: row.id,
  lotId: row.lotId,
  userId: row.userId,
  createdAt: row.createdAt,
});

@injectable()
export class DrizzleLotExecutionRepository extends LotExecutionRepository {
  constructor(@inject(DbToken) private readonly db: Db) {
    super();
  }

  override async create(data: {
    id: LotExecutionId;
    lotId: LotId;
    userId: UserId;
    createdAt: Date;
  }): Promise<LotExecutionEntity> {
    const inserted = await this.db.insert(lotExecutions).values(data).returning();
    return toEntity(inserted[0]!);
  }

  override async listDatesForLot(lotId: LotId, userId: UserId): Promise<Date[]> {
    const rows = await this.db
      .select({ createdAt: lotExecutions.createdAt })
      .from(lotExecutions)
      .where(and(eq(lotExecutions.lotId, lotId), eq(lotExecutions.userId, userId)))
      .orderBy(lotExecutions.createdAt);
    return rows.map((r) => r.createdAt);
  }

  override async listForUser(
    userId: UserId,
    filter?: { lotId?: LotId },
  ): Promise<LotExecutionEntity[]> {
    const conds = [eq(lotExecutions.userId, userId)];
    if (filter?.lotId) conds.push(eq(lotExecutions.lotId, filter.lotId));
    const rows = await this.db
      .select()
      .from(lotExecutions)
      .where(and(...conds))
      .orderBy(desc(lotExecutions.createdAt));
    return rows.map(toEntity);
  }
}
