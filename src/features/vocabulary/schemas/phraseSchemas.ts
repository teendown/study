// ===========================
// Phrase Zod Schemas
// ===========================
// 설계서 섹션 7.5, 9.8 기반

import { z } from 'zod';

export const createPhraseSchema = z.object({
  phrase: z
    .string()
    .min(1, '숙어를 입력하세요')
    .max(150, '숙어는 150자 이내로 입력하세요')
    .trim(),
  meaning: z
    .string()
    .min(1, '뜻을 입력하세요')
    .max(500, '뜻은 500자 이내로 입력하세요')
    .trim(),
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

export const updatePhraseSchema = createPhraseSchema.partial();

export const searchPhraseSchema = z.object({
  query: z.string().max(100).optional().default(''),
  difficulty: z.number().min(1).max(5).optional(),
  grade: z.number().min(7).max(12).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
});

export type CreatePhraseInput = z.infer<typeof createPhraseSchema>;
export type UpdatePhraseInput = z.infer<typeof updatePhraseSchema>;
export type SearchPhraseInput = z.input<typeof searchPhraseSchema>;
export type SearchPhraseOutput = z.output<typeof searchPhraseSchema>;
