// ===========================
// Vocabulary Zod Schemas
// ===========================
// 설계서 섹션 57 기반
// 단어 등록/수정 시 유효성 검증

import { z } from 'zod';

/** 단어 등록 스키마 */
export const createVocabularySchema = z.object({
  word: z
    .string()
    .min(1, '단어를 입력하세요')
    .max(100, '단어는 100자 이내로 입력하세요')
    .trim(),
  meaning: z
    .string()
    .min(1, '뜻을 입력하세요')
    .max(500, '뜻은 500자 이내로 입력하세요')
    .trim(),
  partOfSpeech: z
    .string()
    .max(50)
    .optional()
    .default(''),
  pronunciation: z
    .string()
    .max(200)
    .optional()
    .default(''),
  exampleSentence: z
    .string()
    .max(1000)
    .optional()
    .default(''),
  exampleTranslation: z
    .string()
    .max(1000)
    .optional()
    .default(''),
  synonyms: z
    .string()
    .max(500)
    .optional()
    .default(''),
  antonyms: z
    .string()
    .max(500)
    .optional()
    .default(''),
  difficulty: z
    .number()
    .min(1)
    .max(5)
    .optional()
    .default(1),
  grade: z
    .number()
    .min(7)
    .max(12)
    .optional(),
  source: z
    .string()
    .max(200)
    .optional()
    .default(''),
});

/** 단어 수정 스키마 (모든 필드 optional) */
export const updateVocabularySchema = createVocabularySchema.partial();

/** 단어 검색 스키마 */
export const searchVocabularySchema = z.object({
  query: z.string().max(100).optional().default(''),
  difficulty: z.number().min(1).max(5).optional(),
  grade: z.number().min(7).max(12).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
});

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>;
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>;
export type SearchVocabularyInput = z.input<typeof searchVocabularySchema>;
export type SearchVocabularyOutput = z.output<typeof searchVocabularySchema>;
