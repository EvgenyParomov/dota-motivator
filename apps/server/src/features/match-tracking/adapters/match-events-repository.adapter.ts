import { and, desc, eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { DbToken } from '../../../app/tokens.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { matchEvents } from '../../../shared/adapters/db/schema/index.js';
import { MatchEventsRepository } from '../application/ports/match-events-repository.js';
import type {
  CreateMatchEventInput,
  MatchEventEntity,
} from '../domain/match-event.js';

const toEntity = (row: typeof matchEvents.$inferSelect): MatchEventEntity => ({
  id: row.id,
  userId: row.userId,
  matchId: row.matchId,
  lobbyType: row.lobbyType,
  startedAt: row.startedAt,
  endedAt: row.endedAt,
  counted: row.counted === 'true',
});

@injectable()
export class DrizzleMatchEventsRepository extends MatchEventsRepository {
  constructor(@inject(DbToken) private readonly db: Db) {
    super();
  }

  override async createIfMissing(input: CreateMatchEventInput): Promise<MatchEventEntity | null> {
    const inserted = await this.db
      .insert(matchEvents)
      .values({
        id: input.id,
        userId: input.userId,
        matchId: input.matchId,
        lobbyType: input.lobbyType,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        counted: input.counted ? 'true' : 'false',
      })
      .onConflictDoNothing({ target: [matchEvents.userId, matchEvents.matchId] })
      .returning();
    return inserted[0] ? toEntity(inserted[0]) : null;
  }

  override async listForUser(userId: UserId): Promise<MatchEventEntity[]> {
    const rows = await this.db
      .select()
      .from(matchEvents)
      .where(eq(matchEvents.userId, userId))
      .orderBy(desc(matchEvents.endedAt));
    return rows.map(toEntity);
  }
}
