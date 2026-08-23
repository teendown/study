// ===========================
// Study Sessions 테이블
// ===========================
// 설계서 섹션 7.8
// 학습 세션 기록

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { subjects } from './subjects';

export const studySessions = sqliteTable('study_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  mode: text('mode', {
    enum: ['learning', 'review', 'speed', 'test'],
  }).notNull(),
  startedAt: text('started_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  endedAt: text('ended_at'),
  totalQuestions: integer('total_questions').notNull().default(0),
  correctAnswers: integer('correct_answers').notNull().default(0),
  wrongAnswers: integer('wrong_answers').notNull().default(0),
  xpEarned: integer('xp_earned').notNull().default(0),
});
