import { pgTable, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const matchEvents = pgTable(
  'match_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    matchId: text('match_id').notNull(),
    lobbyType: text('lobby_type').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }).notNull().defaultNow(),
    counted: text('counted').notNull().default('true'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqUserMatch: uniqueIndex('match_events_user_match_uniq').on(t.userId, t.matchId),
    byUserEnded: index('match_events_user_ended').on(t.userId, t.endedAt),
  }),
);

export type MatchEventRow = typeof matchEvents.$inferSelect;
