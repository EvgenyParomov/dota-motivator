import { pgTable, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const balances = pgTable('balances', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: numeric('balance', { precision: 12, scale: 4 }).notNull().default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type BalanceRow = typeof balances.$inferSelect;
