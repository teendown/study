// ===========================
// Study Answers 테이블
// ===========================
// 설계서 섹션 7.9
// 개별 문제 답변 기록 (반응 속도 포함)

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { studySessions } from './study-sessions';
import { questions } from './questions';
import { learningItems } from './learning-items';

export const studyAnswers = sqliteTable('study_answers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id')
    .notNull()
    .references(() => studySessions.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  questionId: text('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  learningItemId: text('learning_item_id')
    .notNull()
    .references(() => learningItems.id, { onDelete: 'cascade' }),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  answer: text('answer'),
  responseTimeMs: integer('response_time_ms'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
