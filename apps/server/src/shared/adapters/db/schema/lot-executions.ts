import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { lots } from './lots';

export const lotExecutions = pgTable(
  'lot_executions',
  {
    id: text('id').primaryKey(),
    lotId: text('lot_id')
      .notNull()
      .references(() => lots.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byLotCreated: index('lot_executions_lot_created').on(t.lotId, t.createdAt),
    byUserCreated: index('lot_executions_user_created').on(t.userId, t.createdAt),
  }),
);

export type LotExecutionRow = typeof lotExecutions.$inferSelect;
