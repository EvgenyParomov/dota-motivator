import { and, eq, gte, lte, sql, desc } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import {
  SPHERES,
  type BalanceEventLine,
  type HeatmapDay,
  type OrphanSphere,
  type Sphere,
  type SphereCount,
  type TopLotEntry,
  type UserId,
} from '@dm/shared';
import { DbToken } from '../../../app/tokens.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import {
  balanceEvents,
  lots,
  lotExecutions,
  matchEvents,
  users,
} from '../../../shared/adapters/db/schema/index.js';
import { StatisticsSource } from '../application/ports/statistics-source.js';
import type { StatsRange } from '../domain/range.js';

@injectable()
export class DrizzleStatisticsSource extends StatisticsSource {
  constructor(@inject(DbToken) private readonly db: Db) {
    super();
  }

  override async userCreatedAt(userId: UserId): Promise<Date> {
    const rows = await this.db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return rows[0]?.createdAt ?? new Date(0);
  }

  override async spheresInRange(userId: UserId, range: StatsRange): Promise<SphereCount[]> {
    const rows = await this.db
      .select({ sphere: lots.sphere, count: sql<number>`count(*)::int` })
      .from(lotExecutions)
      .innerJoin(lots, eq(lots.id, lotExecutions.lotId))
      .where(
        and(
          eq(lotExecutions.userId, userId),
          gte(lotExecutions.createdAt, range.from),
          lte(lotExecutions.createdAt, range.to),
        ),
      )
      .groupBy(lots.sphere);
    const map = new Map<string, number>(rows.map((r) => [r.sphere, r.count]));
    return SPHERES.map((sphere) => ({ sphere, count: map.get(sphere) ?? 0 }));
  }

  override async topLots(
    userId: UserId,
    range: StatsRange,
    limit: number,
  ): Promise<TopLotEntry[]> {
    const rows = await this.db
      .select({
        lotId: lots.id,
        name: lots.name,
        sphere: lots.sphere,
        count: sql<number>`count(*)::int`,
      })
      .from(lotExecutions)
      .innerJoin(lots, eq(lots.id, lotExecutions.lotId))
      .where(
        and(
          eq(lotExecutions.userId, userId),
          gte(lotExecutions.createdAt, range.from),
          lte(lotExecutions.createdAt, range.to),
        ),
      )
      .groupBy(lots.id, lots.name, lots.sphere)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);
    return rows.map((r) => ({
      lotId: r.lotId,
      name: r.name,
      sphere: r.sphere as Sphere,
      count: r.count,
    }));
  }

  override async balanceEvents(userId: UserId, range: StatsRange): Promise<BalanceEventLine[]> {
    const rows = await this.db
      .select()
      .from(balanceEvents)
      .where(
        and(
          eq(balanceEvents.userId, userId),
          gte(balanceEvents.createdAt, range.from),
          lte(balanceEvents.createdAt, range.to),
        ),
      )
      .orderBy(balanceEvents.createdAt);
    return rows.map((r) => ({
      at: r.createdAt.toISOString(),
      delta: Number(r.delta),
      type:
        r.causeKind === 'lot-execution'
          ? 'lot'
          : r.causeKind === 'match'
          ? 'match'
          : 'initial',
      description: r.description,
    }));
  }

  override async heatmap(userId: UserId, range: StatsRange): Promise<HeatmapDay[]> {
    const execRows = await this.db
      .select({
        day: sql<string>`to_char(${lotExecutions.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(lotExecutions)
      .where(
        and(
          eq(lotExecutions.userId, userId),
          gte(lotExecutions.createdAt, range.from),
          lte(lotExecutions.createdAt, range.to),
        ),
      )
      .groupBy(sql`to_char(${lotExecutions.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`);
    const matchRows = await this.db
      .select({
        day: sql<string>`to_char(${matchEvents.endedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(matchEvents)
      .where(
        and(
          eq(matchEvents.userId, userId),
          gte(matchEvents.endedAt, range.from),
          lte(matchEvents.endedAt, range.to),
        ),
      )
      .groupBy(sql`to_char(${matchEvents.endedAt} at time zone 'UTC', 'YYYY-MM-DD')`);

    const days = new Map<string, HeatmapDay>();
    for (const r of execRows) {
      days.set(r.day, { date: r.day, executions: r.count, matches: 0 });
    }
    for (const r of matchRows) {
      const cur = days.get(r.day) ?? { date: r.day, executions: 0, matches: 0 };
      cur.matches = r.count;
      days.set(r.day, cur);
    }
    return Array.from(days.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  override async orphanSpheres(
    userId: UserId,
    now: Date,
    orphanDays: number,
  ): Promise<OrphanSphere[]> {
    const cutoff = new Date(now.getTime() - orphanDays * 86400_000);
    const recent = await this.db
      .select({ sphere: lots.sphere, max: sql<Date>`max(${lotExecutions.createdAt})` })
      .from(lotExecutions)
      .innerJoin(lots, eq(lots.id, lotExecutions.lotId))
      .where(
        and(eq(lotExecutions.userId, userId), gte(lotExecutions.createdAt, cutoff)),
      )
      .groupBy(lots.sphere);
    const active = new Set(recent.map((r) => r.sphere as Sphere));

    const last = await this.db
      .select({ sphere: lots.sphere, max: sql<Date | null>`max(${lotExecutions.createdAt})` })
      .from(lots)
      .leftJoin(
        lotExecutions,
        and(eq(lotExecutions.lotId, lots.id), eq(lotExecutions.userId, userId)),
      )
      .where(eq(lots.userId, userId))
      .groupBy(lots.sphere);
    const lastBySphere = new Map<string, Date | null>(
      last.map((r) => [r.sphere, r.max ?? null]),
    );

    return SPHERES.filter((s) => !active.has(s)).map((sphere) => {
      const lastAt = lastBySphere.get(sphere) ?? null;
      const daysWithoutActivity = lastAt
        ? Math.floor((now.getTime() - lastAt.getTime()) / 86400_000)
        : 9999;
      return { sphere, daysWithoutActivity };
    });
  }
}
