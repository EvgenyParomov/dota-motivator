import { pgTable, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const balanceEvents = pgTable(
  'balance_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    delta: numeric('delta', { precision: 12, scale: 4 }).notNull(),
    causeKind: text('cause_kind').notNull(),
    causeId: text('cause_id'),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserCreated: index('balance_events_user_created').on(t.userId, t.createdAt),
  }),
);

export type BalanceEventRow = typeof balanceEvents.$inferSelect;
