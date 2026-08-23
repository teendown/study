// ===========================
// Phrases 테이블
// ===========================
// 설계서 섹션 7.5
// 영어 숙어/관용구 (learning_items의 하위 테이블)

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { learningItems } from './learning-items';

export const phrases = sqliteTable('phrases', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  learningItemId: text('learning_item_id')
    .notNull()
    .unique()
    .references(() => learningItems.id, { onDelete: 'cascade' }),
  phrase: text('phrase').notNull(),
  meaning: text('meaning').notNull(),
  exampleSentence: text('example_sentence'),
  exampleTranslation: text('example_translation'),
  difficulty: integer('difficulty').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
