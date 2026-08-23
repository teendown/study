// ===========================
// Questions 테이블
// ===========================
// 설계서 섹션 7.6
// 학습 문제 (learning_items에 1:N 관계)

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { learningItems } from './learning-items';

export const questions = sqliteTable('questions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  learningItemId: text('learning_item_id')
    .notNull()
    .references(() => learningItems.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'multiple_choice',
      'fill_blank',
      'spelling',
      'listening',
      'translation',
      'sentence_completion',
      'matching',
      'typing',
    ],
  }).notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  options: text('options', { mode: 'json' }),
  explanation: text('explanation'),
  difficulty: integer('difficulty').notNull().default(1),
  timeLimit: integer('time_limit'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
