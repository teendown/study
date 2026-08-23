// ===========================
// Vocabulary Server Actions
// ===========================
// 설계서 섹션 25, 26 기반
// UI → Server Action → Repository → Drizzle → Turso

'use server';

import {
  createVocabulary,
  getVocabularies,
  getVocabularyById,
  updateVocabulary,
  deleteVocabulary,
  checkDuplicateWord,
} from '../repositories';
import {
  createVocabularySchema,
  updateVocabularySchema,
  searchVocabularySchema,
  type CreateVocabularyInput,
  type UpdateVocabularyInput,
  type SearchVocabularyInput,
} from '../schemas';
import type { VocabularyWithItem, VocabularyListResult } from '../types';

// 영어 과목 ID를 가져오는 헬퍼
// Phase 2에서 seed된 ENGLISH 과목 사용
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
    throw new Error('영어 과목이 설정되지 않았습니다. db:seed를 실행하세요.');
  }
  return subject.id;
}

/** 서버 액션 결과 타입 */
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 단어 등록
 */
export async function addVocabularyAction(
  input: CreateVocabularyInput
): Promise<ActionResult<VocabularyWithItem>> {
  try {
    const parsed = createVocabularySchema.parse(input);
    const subjectId = await getEnglishSubjectId();

    // 중복 확인
    const isDuplicate = await checkDuplicateWord(subjectId, parsed.word);
    if (isDuplicate) {
      return { success: false, error: `"${parsed.word}"은(는) 이미 등록된 단어입니다.` };
    }

    const vocab = await createVocabulary(subjectId, parsed);
    return { success: true, data: vocab };
  } catch (err) {
    const message = err instanceof Error ? err.message : '단어 등록에 실패했습니다.';
    return { success: false, error: message };
  }
}

/**
 * 단어 목록 조회
 */
export async function getVocabulariesAction(
  params: Partial<SearchVocabularyInput> = {}
): Promise<ActionResult<VocabularyListResult>> {
  try {
    const parsed = searchVocabularySchema.parse(params);
    const subjectId = await getEnglishSubjectId();
    const result = await getVocabularies(subjectId, parsed);
    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : '단어 목록을 불러올 수 없습니다.';
    return { success: false, error: message };
  }
}

/**
 * 단어 상세 조회
 */
export async function getVocabularyByIdAction(
  id: string
): Promise<ActionResult<VocabularyWithItem>> {
  try {
    const vocab = await getVocabularyById(id);
    if (!vocab) {
      return { success: false, error: '단어를 찾을 수 없습니다.' };
    }
    return { success: true, data: vocab };
  } catch (err) {
    const message = err instanceof Error ? err.message : '단어 조회에 실패했습니다.';
    return { success: false, error: message };
  }
}

/**
 * 단어 수정
 */
export async function updateVocabularyAction(
  id: string,
  input: UpdateVocabularyInput
): Promise<ActionResult> {
  try {
    const parsed = updateVocabularySchema.parse(input);
    await updateVocabulary(id, parsed);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : '단어 수정에 실패했습니다.';
    return { success: false, error: message };
  }
}

/**
 * 단어 삭제
 */
export async function deleteVocabularyAction(
  id: string
): Promise<ActionResult> {
  try {
    await deleteVocabulary(id);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : '단어 삭제에 실패했습니다.';
    return { success: false, error: message };
  }
}
