// ===========================
// Achievements 테이블
// ===========================
// 설계서 섹션 7.10
// 업적 정의

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const achievements = sqliteTable('achievements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  xpReward: integer('xp_reward').notNull().default(0),
  conditionType: text('condition_type', {
    enum: [
      'total_words',
      'total_questions',
      'streak_days',
      'consecutive_correct',
      'accuracy_rate',
      'mastered_words',
      'study_sessions',
    ],
  }).notNull(),
  conditionValue: integer('condition_value').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
