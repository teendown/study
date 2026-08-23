// ===========================
// Users 테이블
// ===========================
// 설계서 섹션 7.1

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['student', 'parent', 'admin'] })
    .notNull()
    .default('student'),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  streak: integer('streak').notNull().default(0),
  lastActiveDate: text('last_active_date'),
  parentId: text('parent_id').references((): ReturnType<typeof text> => users.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
