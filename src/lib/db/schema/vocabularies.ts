// ===========================
// Vocabularies 테이블
// ===========================
// 설계서 섹션 7.4
// 영어 단어 상세 정보 (learning_items의 하위 테이블)

import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { learningItems } from './learning-items';

export const vocabularies = sqliteTable('vocabularies', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  learningItemId: text('learning_item_id')
    .notNull()
    .unique()
    .references(() => learningItems.id, { onDelete: 'cascade' }),
  word: text('word').notNull(),
  meaning: text('meaning').notNull(),
  partOfSpeech: text('part_of_speech'),
  pronunciation: text('pronunciation'),
  audioUrl: text('audio_url'),
  exampleSentence: text('example_sentence'),
  exampleTranslation: text('example_translation'),
  synonyms: text('synonyms'),
  antonyms: text('antonyms'),
  frequency: text('frequency'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
