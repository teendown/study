// ===========================
// Subjects 테이블
// ===========================
// 설계서 섹션 7.2

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code', {
    enum: ['ENGLISH', 'MATH', 'KOREAN', 'SCIENCE', 'SOCIAL'],
  }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
