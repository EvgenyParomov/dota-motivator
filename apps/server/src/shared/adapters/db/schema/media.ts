import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const media = pgTable('media', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mediaKey: text('media_key').notNull().unique(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type MediaRow = typeof media.$inferSelect;
