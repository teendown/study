// ===========================
// Phrase Server Actions
// ===========================
// 설계서 섹션 25, 26 기반

'use server';

import {
  createPhrase,
  getPhrases,
  getPhraseById,
  updatePhrase,
  deletePhrase,
} from '../repositories/phraseRepository';
import {
  createPhraseSchema,
  updatePhraseSchema,
  searchPhraseSchema,
  type CreatePhraseInput,
  type UpdatePhraseInput,
  type SearchPhraseInput,
} from '../schemas/phraseSchemas';
import type { PhraseWithItem, PhraseListResult } from '../types/phraseTypes';
import { getDb, schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';

async function getEnglishSubjectId(): Promise<string> {
  const db = getDb();
  const [subject] = await db
    .select({ id: schema.subjects.id })
    .from(schema.subjects)
    .where(eq(schema.subjects.code, 'ENGLISH'))
    .limit(1);

  if (!subject) {
    throw new Error('영어 과목이 설정되지 않았습니다.');
  }
  return subject.id;
}

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 숙어 등록
 */
export async function addPhraseAction(
  input: CreatePhraseInput
): Promise<ActionResult<PhraseWithItem>> {
  try {
    const parsed = createPhraseSchema.parse(input);
    const subjectId = await getEnglishSubjectId();
    const phrase = await createPhrase(subjectId, parsed);
    return { success: true, data: phrase };
  } catch (err) {
    const message = err instanceof Error ? err.message : '숙어 등록에 실패했습니다.';
    return { success: false, error: message };
  }
}

/**
 * 숙어 목록 조회
 */
export async function getPhrasesAction(
  params: Partial<SearchPhraseInput> = {}
): Promise<ActionResult<PhraseListResult>> {
  try {
    const parsed = searchPhraseSchema.parse(params);
    const subjectId = await getEnglishSubjectId();
    const result = await getPhrases(subjectId, parsed);
    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : '숙어 목록을 불러올 수 없습니다.';
    return { success: false, error: message };
  }
}

/**
 * 숙어 상세 조회
 */
export async function getPhraseByIdAction(
  id: string
): Promise<ActionResult<PhraseWithItem>> {
  try {
    const phrase = await getPhraseById(id);
    if (!phrase) {
      return { success: false, error: '숙어를 찾을 수 없습니다.' };
    }
    return { success: true, data: phrase };
  } catch (err) {
    const message = err instanceof Error ? err.message : '숙어 조회에 실패했습니다.';
    return { success: false, error: message };
  }
}

/**
 * 숙어 수정
 */
export async function updatePhraseAction(
  id: string,
  input: UpdatePhraseInput
): Promise<ActionResult> {
  try {
    const parsed = updatePhraseSchema.parse(input);
    await updatePhrase(id, parsed);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : '숙어 수정에 실패했습니다.';
    return { success: false, error: message };
  }
}

/**
 * 숙어 삭제
 */
export async function deletePhraseAction(id: string): Promise<ActionResult> {
  try {
    await deletePhrase(id);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : '숙어 삭제에 실패했습니다.';
    return { success: false, error: message };
  }
}
