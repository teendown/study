// ===========================
// User Progress 테이블
// ===========================
// 설계서 섹션 7.7
// 학생별 학습 항목 진행 상태 및 복습 스케줄

import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { learningItems } from './learning-items';

export const userProgress = sqliteTable(
  'user_progress',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    learningItemId: text('learning_item_id')
      .notNull()
      .references(() => learningItems.id, { onDelete: 'cascade' }),
    correctCount: integer('correct_count').notNull().default(0),
    wrongCount: integer('wrong_count').notNull().default(0),
    totalAttempts: integer('total_attempts').notNull().default(0),
    masteryScore: real('mastery_score').notNull().default(0),
    streak: integer('streak').notNull().default(0),
    lastStudiedAt: text('last_studied_at'),
    nextReviewAt: text('next_review_at'),
    easeFactor: real('ease_factor').notNull().default(2.5),
    intervalDays: real('interval_days').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex('user_progress_user_item_idx').on(
      table.userId,
      table.learningItemId
    ),
  ]
);
