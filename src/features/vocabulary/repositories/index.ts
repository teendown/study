// ===========================
// Vocabulary Repository
// ===========================
// 설계서 섹션 25, 27 기반
// DB 접근 로직 분리

'use server';

import { eq, like, and, desc, count, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/client';
import type { CreateVocabularyInput, UpdateVocabularyInput, SearchVocabularyOutput } from '../schemas';
import type { VocabularyWithItem, VocabularyListResult } from '../types';

/**
 * 단어 등록
 * learning_items + vocabularies 두 테이블에 동시 삽입
 */
export async function createVocabulary(
  subjectId: string,
  input: CreateVocabularyInput
): Promise<VocabularyWithItem> {
  const db = getDb();

  // 1. learning_items에 삽입
  const learningItemId = crypto.randomUUID();
  await db.insert(schema.learningItems).values({
    id: learningItemId,
    subjectId,
    type: 'vocabulary',
    title: input.word,
    content: input.meaning,
    difficulty: input.difficulty ?? 1,
    grade: input.grade,
    source: input.source || null,
  });

  // 2. vocabularies에 삽입
  const vocabId = crypto.randomUUID();
  await db.insert(schema.vocabularies).values({
    id: vocabId,
    learningItemId,
    word: input.word,
    meaning: input.meaning,
    partOfSpeech: input.partOfSpeech || null,
    pronunciation: input.pronunciation || null,
    exampleSentence: input.exampleSentence || null,
    exampleTranslation: input.exampleTranslation || null,
    synonyms: input.synonyms || null,
    antonyms: input.antonyms || null,
  });

  return {
    id: vocabId,
    word: input.word,
    meaning: input.meaning,
    partOfSpeech: input.partOfSpeech || null,
    pronunciation: input.pronunciation || null,
    audioUrl: null,
    exampleSentence: input.exampleSentence || null,
    exampleTranslation: input.exampleTranslation || null,
    synonyms: input.synonyms || null,
    antonyms: input.antonyms || null,
    frequency: null,
    difficulty: input.difficulty ?? 1,
    grade: input.grade ?? null,
    source: input.source || null,
    learningItemId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 단어 목록 조회 (검색/페이징)
 */
export async function getVocabularies(
  subjectId: string,
  params: SearchVocabularyOutput
): Promise<VocabularyListResult> {
  const db = getDb();
  const { query, difficulty, grade, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  // 조건 구성
  const conditions = [eq(schema.learningItems.subjectId, subjectId)];

  if (query) {
    conditions.push(
      sql`(${schema.vocabularies.word} LIKE ${'%' + query + '%'} OR ${schema.vocabularies.meaning} LIKE ${'%' + query + '%'})`
    );
  }
  if (difficulty) {
    conditions.push(eq(schema.learningItems.difficulty, difficulty));
  }
  if (grade) {
    conditions.push(eq(schema.learningItems.grade, grade));
  }

  const whereClause = and(...conditions);

  // 총 개수
  const [countResult] = await db
    .select({ total: count() })
    .from(schema.vocabularies)
    .innerJoin(
      schema.learningItems,
      eq(schema.vocabularies.learningItemId, schema.learningItems.id)
    )
    .where(whereClause);

  const total = countResult?.total ?? 0;

  // 데이터 조회
  const rows = await db
    .select({
      id: schema.vocabularies.id,
      word: schema.vocabularies.word,
      meaning: schema.vocabularies.meaning,
      partOfSpeech: schema.vocabularies.partOfSpeech,
      pronunciation: schema.vocabularies.pronunciation,
      audioUrl: schema.vocabularies.audioUrl,
      exampleSentence: schema.vocabularies.exampleSentence,
      exampleTranslation: schema.vocabularies.exampleTranslation,
      synonyms: schema.vocabularies.synonyms,
      antonyms: schema.vocabularies.antonyms,
      frequency: schema.vocabularies.frequency,
      difficulty: schema.learningItems.difficulty,
      grade: schema.learningItems.grade,
      source: schema.learningItems.source,
      learningItemId: schema.vocabularies.learningItemId,
      createdAt: schema.vocabularies.createdAt,
      updatedAt: schema.vocabularies.updatedAt,
    })
    .from(schema.vocabularies)
    .innerJoin(
      schema.learningItems,
      eq(schema.vocabularies.learningItemId, schema.learningItems.id)
    )
    .where(whereClause)
    .orderBy(desc(schema.vocabularies.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 단어 상세 조회
 */
export async function getVocabularyById(
  id: string
): Promise<VocabularyWithItem | null> {
  const db = getDb();

  const rows = await db
    .select({
      id: schema.vocabularies.id,
      word: schema.vocabularies.word,
      meaning: schema.vocabularies.meaning,
      partOfSpeech: schema.vocabularies.partOfSpeech,
      pronunciation: schema.vocabularies.pronunciation,
      audioUrl: schema.vocabularies.audioUrl,
      exampleSentence: schema.vocabularies.exampleSentence,
      exampleTranslation: schema.vocabularies.exampleTranslation,
      synonyms: schema.vocabularies.synonyms,
      antonyms: schema.vocabularies.antonyms,
      frequency: schema.vocabularies.frequency,
      difficulty: schema.learningItems.difficulty,
      grade: schema.learningItems.grade,
      source: schema.learningItems.source,
      learningItemId: schema.vocabularies.learningItemId,
      createdAt: schema.vocabularies.createdAt,
      updatedAt: schema.vocabularies.updatedAt,
    })
    .from(schema.vocabularies)
    .innerJoin(
      schema.learningItems,
      eq(schema.vocabularies.learningItemId, schema.learningItems.id)
    )
    .where(eq(schema.vocabularies.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * 단어 수정
 */
export async function updateVocabulary(
  id: string,
  input: UpdateVocabularyInput
): Promise<void> {
  const db = getDb();

  // vocabulary 정보 가져오기
  const [vocab] = await db
    .select({ learningItemId: schema.vocabularies.learningItemId })
    .from(schema.vocabularies)
    .where(eq(schema.vocabularies.id, id))
    .limit(1);

  if (!vocab) throw new Error('단어를 찾을 수 없습니다.');

  // vocabularies 업데이트
  const vocabUpdate: Record<string, unknown> = {
    updatedAt: sql`(datetime('now'))`,
  };
  if (input.word !== undefined) vocabUpdate.word = input.word;
  if (input.meaning !== undefined) vocabUpdate.meaning = input.meaning;
  if (input.partOfSpeech !== undefined) vocabUpdate.partOfSpeech = input.partOfSpeech || null;
  if (input.pronunciation !== undefined) vocabUpdate.pronunciation = input.pronunciation || null;
  if (input.exampleSentence !== undefined) vocabUpdate.exampleSentence = input.exampleSentence || null;
  if (input.exampleTranslation !== undefined) vocabUpdate.exampleTranslation = input.exampleTranslation || null;
  if (input.synonyms !== undefined) vocabUpdate.synonyms = input.synonyms || null;
  if (input.antonyms !== undefined) vocabUpdate.antonyms = input.antonyms || null;

  await db
    .update(schema.vocabularies)
    .set(vocabUpdate)
    .where(eq(schema.vocabularies.id, id));

  // learning_items 업데이트
  const itemUpdate: Record<string, unknown> = {
    updatedAt: sql`(datetime('now'))`,
  };
  if (input.word !== undefined) itemUpdate.title = input.word;
  if (input.meaning !== undefined) itemUpdate.content = input.meaning;
  if (input.difficulty !== undefined) itemUpdate.difficulty = input.difficulty;
  if (input.grade !== undefined) itemUpdate.grade = input.grade;
  if (input.source !== undefined) itemUpdate.source = input.source || null;

  await db
    .update(schema.learningItems)
    .set(itemUpdate)
    .where(eq(schema.learningItems.id, vocab.learningItemId));
}

/**
 * 단어 삭제
 * learning_items를 삭제하면 CASCADE로 vocabularies도 삭제됨
 */
export async function deleteVocabulary(id: string): Promise<void> {
  const db = getDb();

  const [vocab] = await db
    .select({ learningItemId: schema.vocabularies.learningItemId })
    .from(schema.vocabularies)
    .where(eq(schema.vocabularies.id, id))
    .limit(1);

  if (!vocab) throw new Error('단어를 찾을 수 없습니다.');

  await db
    .delete(schema.learningItems)
    .where(eq(schema.learningItems.id, vocab.learningItemId));
}

/**
 * 중복 단어 확인
 */
export async function checkDuplicateWord(
  subjectId: string,
  word: string
): Promise<boolean> {
  const db = getDb();

  const rows = await db
    .select({ id: schema.vocabularies.id })
    .from(schema.vocabularies)
    .innerJoin(
      schema.learningItems,
      eq(schema.vocabularies.learningItemId, schema.learningItems.id)
    )
    .where(
      and(
        eq(schema.learningItems.subjectId, subjectId),
        eq(schema.vocabularies.word, word)
      )
    )
    .limit(1);

  return rows.length > 0;
}
