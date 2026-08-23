// ===========================
// Learning Items 테이블
// ===========================
// 설계서 섹션 7.3
// 모든 학습 콘텐츠의 공통 부모 테이블

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { subjects } from './subjects';

export const learningItems = sqliteTable('learning_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'vocabulary',
      'phrase',
      'grammar',
      'reading',
      'problem',
      'concept',
      'formula',
    ],
  }).notNull(),
  title: text('title').notNull(),
  content: text('content'),
  difficulty: integer('difficulty').notNull().default(1),
  grade: integer('grade'),
  source: text('source'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
