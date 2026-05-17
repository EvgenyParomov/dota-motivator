import { and, eq, sql, desc } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import type { LotId, UserId, LotRule, Sphere } from '@dm/shared';
import { DbToken } from '../../../app/tokens.js';
import { IdGenerator } from '../../../shared/application/ports/id-generator.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { lots } from '../../../shared/adapters/db/schema/index.js';
import { LotRepository } from '../application/ports/lot-repository.js';
import type {
  CreateLotData,
  LotEntity,
  UpdateLotData,
} from '../domain/lot-entity.js';

const toEntity = (row: typeof lots.$inferSelect): LotEntity => ({
  id: row.id,
  userId: row.userId,
  name: row.name,
  sphere: row.sphere as Sphere,
  reward: Number(row.reward),
  rules: (row.rules ?? []) as LotRule[],
  iconMediaKey: row.iconMediaKey,
  isActive: row.isActive,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@injectable()
export class DrizzleLotRepository extends LotRepository {
  constructor(
    @inject(DbToken) private readonly db: Db,
    @inject(IdGenerator) private readonly ids: IdGenerator,
  ) {
    super();
  }

  override async create(data: CreateLotData): Promise<LotEntity> {
    const id = this.ids.generate();
    const inserted = await this.db
      .insert(lots)
      .values({
        id,
        userId: data.userId,
        name: data.name,
        sphere: data.sphere,
        reward: String(data.reward),
        rules: data.rules,
        iconMediaKey: data.iconMediaKey,
      })
      .returning();
    return toEntity(inserted[0]!);
  }

  override async findById(id: LotId, userId: UserId): Promise<LotEntity | null> {
    const rows = await this.db
      .select()
      .from(lots)
      .where(and(eq(lots.id, id), eq(lots.userId, userId)))
      .limit(1);
    return rows[0] ? toEntity(rows[0]) : null;
  }

  override async update(
    id: LotId,
    userId: UserId,
    data: UpdateLotData,
  ): Promise<LotEntity | null> {
    const patch: Record<string, unknown> = { updatedAt: sql`now()` };
    if (data.name !== undefined) patch.name = data.name;
    if (data.sphere !== undefined) patch.sphere = data.sphere;
    if (data.reward !== undefined) patch.reward = String(data.reward);
    if (data.rules !== undefined) patch.rules = data.rules;
    if (data.iconMediaKey !== undefined) patch.iconMediaKey = data.iconMediaKey;
    const updated = await this.db
      .update(lots)
      .set(patch)
      .where(and(eq(lots.id, id), eq(lots.userId, userId)))
      .returning();
    return updated[0] ? toEntity(updated[0]) : null;
  }

  override async archive(id: LotId, userId: UserId): Promise<void> {
    await this.db
      .update(lots)
      .set({ isActive: false, updatedAt: sql`now()` })
      .where(and(eq(lots.id, id), eq(lots.userId, userId)));
  }

  override async listActive(userId: UserId): Promise<LotEntity[]> {
    const rows = await this.db
      .select()
      .from(lots)
      .where(and(eq(lots.userId, userId), eq(lots.isActive, true)))
      .orderBy(desc(lots.createdAt));
    return rows.map(toEntity);
  }
}
