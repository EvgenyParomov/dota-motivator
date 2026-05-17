import { pgTable, text, numeric, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import type { LotRule } from '@dm/shared';
import { users } from './users';

export const lots = pgTable(
  'lots',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sphere: text('sphere').notNull(),
    reward: numeric('reward', { precision: 6, scale: 4 }).notNull(),
    rules: jsonb('rules').$type<LotRule[]>().notNull().default([]),
    iconMediaKey: text('icon_media_key'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserActive: index('lots_user_active').on(t.userId, t.isActive),
  }),
);

export type LotRow = typeof lots.$inferSelect;
