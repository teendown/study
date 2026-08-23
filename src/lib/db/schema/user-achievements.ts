// ===========================
// User Achievements 테이블
// ===========================
// 설계서 섹션 7.11
// 사용자가 획득한 업적

import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { achievements } from './achievements';

export const userAchievements = sqliteTable(
  'user_achievements',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),
    earnedAt: text('earned_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex('user_achievements_user_achievement_idx').on(
      table.userId,
      table.achievementId
    ),
  ]
);
