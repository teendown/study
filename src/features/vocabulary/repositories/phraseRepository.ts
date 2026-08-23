// ===========================
// Phrase Repository
// ===========================
// 설계서 섹션 7.5, 27 기반

'use server';

import { eq, and, desc, count, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/client';
import type { CreatePhraseInput, UpdatePhraseInput, SearchPhraseOutput } from '../schemas/phraseSchemas';
import type { PhraseWithItem, PhraseListResult } from '../types/phraseTypes';

/**
 * 숙어 등록
 */
export async function createPhrase(
  subjectId: string,
  input: CreatePhraseInput
): Promise<PhraseWithItem> {
  const db = getDb();

  // 1. learning_items에 삽입
  const learningItemId = crypto.randomUUID();
  await db.insert(schema.learningItems).values({
    id: learningItemId,
    subjectId,
    type: 'phrase',
    title: input.phrase,
    content: input.meaning,
    difficulty: input.difficulty ?? 1,
    grade: input.grade,
    source: input.source || null,
  });

  // 2. phrases에 삽입
  const phraseId = crypto.randomUUID();
  await db.insert(schema.phrases).values({
    id: phraseId,
    learningItemId,
    phrase: input.phrase,
    meaning: input.meaning,
    exampleSentence: input.exampleSentence || null,
    exampleTranslation: input.exampleTranslation || null,
    difficulty: input.difficulty ?? 1,
  });

  return {
    id: phraseId,
    phrase: input.phrase,
    meaning: input.meaning,
    exampleSentence: input.exampleSentence || null,
    exampleTranslation: input.exampleTranslation || null,
    difficulty: input.difficulty ?? 1,
    grade: input.grade ?? null,
    source: input.source || null,
    learningItemId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 숙어 목록 조회
 */
export async function getPhrases(
  subjectId: string,
  params: SearchPhraseOutput
): Promise<PhraseListResult> {
  const db = getDb();
  const { query, difficulty, grade, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const conditions = [eq(schema.learningItems.subjectId, subjectId)];

  if (query) {
    conditions.push(
      sql`(${schema.phrases.phrase} LIKE ${'%' + query + '%'} OR ${schema.phrases.meaning} LIKE ${'%' + query + '%'})`
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
    .from(schema.phrases)
    .innerJoin(
      schema.learningItems,
      eq(schema.phrases.learningItemId, schema.learningItems.id)
    )
    .where(whereClause);

  const total = countResult?.total ?? 0;

  // 데이터 조회
  const rows = await db
    .select({
      id: schema.phrases.id,
      phrase: schema.phrases.phrase,
      meaning: schema.phrases.meaning,
      exampleSentence: schema.phrases.exampleSentence,
      exampleTranslation: schema.phrases.exampleTranslation,
      difficulty: schema.learningItems.difficulty,
      grade: schema.learningItems.grade,
      source: schema.learningItems.source,
      learningItemId: schema.phrases.learningItemId,
      createdAt: schema.phrases.createdAt,
      updatedAt: schema.phrases.updatedAt,
    })
    .from(schema.phrases)
    .innerJoin(
      schema.learningItems,
      eq(schema.phrases.learningItemId, schema.learningItems.id)
    )
    .where(whereClause)
    .orderBy(desc(schema.phrases.createdAt))
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
 * 숙어 상세 조회
 */
export async function getPhraseById(id: string): Promise<PhraseWithItem | null> {
  const db = getDb();

  const rows = await db
    .select({
      id: schema.phrases.id,
      phrase: schema.phrases.phrase,
      meaning: schema.phrases.meaning,
      exampleSentence: schema.phrases.exampleSentence,
      exampleTranslation: schema.phrases.exampleTranslation,
      difficulty: schema.learningItems.difficulty,
      grade: schema.learningItems.grade,
      source: schema.learningItems.source,
      learningItemId: schema.phrases.learningItemId,
      createdAt: schema.phrases.createdAt,
      updatedAt: schema.phrases.updatedAt,
    })
    .from(schema.phrases)
    .innerJoin(
      schema.learningItems,
      eq(schema.phrases.learningItemId, schema.learningItems.id)
    )
    .where(eq(schema.phrases.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * 숙어 수정
 */
export async function updatePhrase(
  id: string,
  input: UpdatePhraseInput
): Promise<void> {
  const db = getDb();

  const [phrase] = await db
    .select({ learningItemId: schema.phrases.learningItemId })
    .from(schema.phrases)
    .where(eq(schema.phrases.id, id))
    .limit(1);

  if (!phrase) throw new Error('숙어를 찾을 수 없습니다.');

  // phrases 업데이트
  const phraseUpdate: Record<string, unknown> = {
    updatedAt: sql`(datetime('now'))`,
  };
  if (input.phrase !== undefined) phraseUpdate.phrase = input.phrase;
  if (input.meaning !== undefined) phraseUpdate.meaning = input.meaning;
  if (input.exampleSentence !== undefined) phraseUpdate.exampleSentence = input.exampleSentence || null;
  if (input.exampleTranslation !== undefined) phraseUpdate.exampleTranslation = input.exampleTranslation || null;
  if (input.difficulty !== undefined) phraseUpdate.difficulty = input.difficulty;

  await db
    .update(schema.phrases)
    .set(phraseUpdate)
    .where(eq(schema.phrases.id, id));

  // learning_items 업데이트
  const itemUpdate: Record<string, unknown> = {
    updatedAt: sql`(datetime('now'))`,
  };
  if (input.phrase !== undefined) itemUpdate.title = input.phrase;
  if (input.meaning !== undefined) itemUpdate.content = input.meaning;
  if (input.difficulty !== undefined) itemUpdate.difficulty = input.difficulty;
  if (input.grade !== undefined) itemUpdate.grade = input.grade;
  if (input.source !== undefined) itemUpdate.source = input.source || null;

  await db
    .update(schema.learningItems)
    .set(itemUpdate)
    .where(eq(schema.learningItems.id, phrase.learningItemId));
}

/**
 * 숙어 삭제
 */
export async function deletePhrase(id: string): Promise<void> {
  const db = getDb();

  const [phrase] = await db
    .select({ learningItemId: schema.phrases.learningItemId })
    .from(schema.phrases)
    .where(eq(schema.phrases.id, id))
    .limit(1);

  if (!phrase) throw new Error('숙어를 찾을 수 없습니다.');

  await db
    .delete(schema.learningItems)
    .where(eq(schema.learningItems.id, phrase.learningItemId));
}
