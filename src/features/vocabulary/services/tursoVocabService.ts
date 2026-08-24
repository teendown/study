// ===========================
// Turso Cloud Database Synchronization Service (PC & Mobile Real-time Sync)
// ===========================
// 브라우저 클라이언트 환경에서 Turso Cloud DB(LibSQL Web API)와 직접 통신하여 모든 기기 간 실시간 데이터 공유

import { createClient } from '@libsql/client/web';
import type { VocabularyWithItem } from '../types';
import type { PhraseWithItem } from '../types/phraseTypes';
import type { CreateVocabularyInput, UpdateVocabularyInput } from '../schemas';
import type { CreatePhraseInput, UpdatePhraseInput } from '../schemas/phraseSchemas';

const TURSO_URL =
  process.env.NEXT_PUBLIC_TURSO_DATABASE_URL ||
  process.env.TURSO_DATABASE_URL ||
  'https://study-bongkeun-choi.aws-ap-northeast-1.turso.io';

const TURSO_TOKEN =
  process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN ||
  process.env.TURSO_AUTH_TOKEN ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc0OTQxMzYsImlkIjoiMDFhMDJlZjMtNjkwMS03OTUzLTk2ZTktY2ZmNDQ5MjExNTY3Iiwia2lkIjoicEo1RHFMd2V3dHJZLTBXWGNxRTd0cnVRNWxrWDlYOVFJNTYxZl9lSC1YTSIsInJpZCI6ImU3OGNiNjUxLTY1YjEtNGYwYy1hYzE4LTRiNWU0NDMwMTViMCJ9.9VgR0mn1uwZNt_FkThfqyOyUmJ7gl1ZlkJuAR925K1pDq86RYsIYUFCu2IaBF-v2alJLxtDiFwSnVsNi9rKJAg';

let _tursoClient: ReturnType<typeof createClient> | null = null;

export function getTursoClient() {
  if (!_tursoClient) {
    _tursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
  }
  return _tursoClient;
}

/**
 * 기본 영어 과목 ID를 확인하고 없으면 자동 생성
 */
async function ensureEnglishSubject(client: ReturnType<typeof createClient>): Promise<string> {
  const subjectId = 'sub-english';
  try {
    await client.execute({
      sql: `INSERT OR IGNORE INTO subjects (id, code, name, description, is_active) VALUES (?, 'ENGLISH', '영어', '고등학교 영어', 1)`,
      args: [subjectId],
    });
  } catch (e) {
    console.warn('ensureEnglishSubject warning:', e);
  }
  return subjectId;
}

// ─────────────────────────────────────────
// 📚 단어 (Vocabularies) Turso 클라우드 연동
// ─────────────────────────────────────────

/**
 * Turso 클라우드 DB에서 모든 단어 목록 조회
 */
export async function fetchAllVocabulariesFromTurso(): Promise<VocabularyWithItem[] | null> {
  try {
    const client = getTursoClient();
    const res = await client.execute(`
      SELECT 
        v.id,
        v.learning_item_id as learningItemId,
        v.word,
        v.meaning,
        v.part_of_speech as partOfSpeech,
        v.pronunciation,
        v.audio_url as audioUrl,
        v.example_sentence as exampleSentence,
        v.example_translation as exampleTranslation,
        v.synonyms,
        v.antonyms,
        v.frequency,
        v.created_at as createdAt,
        v.updated_at as updatedAt,
        COALESCE(li.difficulty, 2) as difficulty,
        COALESCE(li.grade, 10) as grade,
        COALESCE(li.source, '직접 등록') as source
      FROM vocabularies v
      LEFT JOIN learning_items li ON v.learning_item_id = li.id
      ORDER BY v.created_at DESC
    `);

    return res.rows.map((row) => ({
      id: String(row.id),
      learningItemId: String(row.learningItemId),
      word: String(row.word),
      meaning: String(row.meaning),
      partOfSpeech: row.partOfSpeech ? String(row.partOfSpeech) : null,
      pronunciation: row.pronunciation ? String(row.pronunciation) : null,
      audioUrl: row.audioUrl ? String(row.audioUrl) : null,
      exampleSentence: row.exampleSentence ? String(row.exampleSentence) : null,
      exampleTranslation: row.exampleTranslation ? String(row.exampleTranslation) : null,
      synonyms: row.synonyms ? String(row.synonyms) : null,
      antonyms: row.antonyms ? String(row.antonyms) : null,
      frequency: row.frequency ? String(row.frequency) : 'high',
      difficulty: typeof row.difficulty === 'number' ? row.difficulty : 2,
      grade: typeof row.grade === 'number' ? row.grade : 10,
      source: row.source ? String(row.source) : '직접 등록',
      createdAt: String(row.createdAt || new Date().toISOString()),
      updatedAt: String(row.updatedAt || new Date().toISOString()),
    }));
  } catch (err) {
    console.warn('Failed to fetch from Turso DB:', err);
    return null;
  }
}

/**
 * Turso 클라우드 DB에 새 단어 등록
 */
export async function addVocabularyToTurso(
  item: VocabularyWithItem
): Promise<boolean> {
  try {
    const client = getTursoClient();
    const subjectId = await ensureEnglishSubject(client);

    // 1. learning_items 생성
    await client.execute({
      sql: `INSERT OR REPLACE INTO learning_items (id, subject_id, type, title, difficulty, grade, source, created_at, updated_at) VALUES (?, ?, 'vocabulary', ?, ?, ?, ?, ?, ?)`,
      args: [
        item.learningItemId,
        subjectId,
        item.word,
        item.difficulty,
        item.grade,
        item.source || '직접 등록',
        item.createdAt,
        item.updatedAt,
      ],
    });

    // 2. vocabularies 생성
    await client.execute({
      sql: `INSERT OR REPLACE INTO vocabularies (id, learning_item_id, word, meaning, part_of_speech, pronunciation, audio_url, example_sentence, example_translation, synonyms, antonyms, frequency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        item.id,
        item.learningItemId,
        item.word,
        item.meaning,
        item.partOfSpeech,
        item.pronunciation,
        item.audioUrl,
        item.exampleSentence,
        item.exampleTranslation,
        item.synonyms,
        item.antonyms,
        item.frequency,
        item.createdAt,
        item.updatedAt,
      ],
    });

    return true;
  } catch (err) {
    console.error('Failed to add vocabulary to Turso:', err);
    return false;
  }
}

/**
 * Turso 클라우드 DB의 단어 정보 수정
 */
export async function updateVocabularyInTurso(
  id: string,
  input: UpdateVocabularyInput
): Promise<boolean> {
  try {
    const client = getTursoClient();
    const now = new Date().toISOString();

    const setClauses: string[] = ['updated_at = ?'];
    const args: (string | number | null)[] = [now];

    if (input.word !== undefined) {
      setClauses.push('word = ?');
      args.push(input.word);
    }
    if (input.meaning !== undefined) {
      setClauses.push('meaning = ?');
      args.push(input.meaning);
    }
    if (input.partOfSpeech !== undefined) {
      setClauses.push('part_of_speech = ?');
      args.push(input.partOfSpeech ?? null);
    }
    if (input.pronunciation !== undefined) {
      setClauses.push('pronunciation = ?');
      args.push(input.pronunciation ?? null);
    }
    if (input.exampleSentence !== undefined) {
      setClauses.push('example_sentence = ?');
      args.push(input.exampleSentence ?? null);
    }
    if (input.exampleTranslation !== undefined) {
      setClauses.push('example_translation = ?');
      args.push(input.exampleTranslation ?? null);
    }
    if (input.synonyms !== undefined) {
      setClauses.push('synonyms = ?');
      args.push(input.synonyms ?? null);
    }
    if (input.antonyms !== undefined) {
      setClauses.push('antonyms = ?');
      args.push(input.antonyms ?? null);
    }

    args.push(id);
    await client.execute({
      sql: `UPDATE vocabularies SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    });

    return true;
  } catch (err) {
    console.error('Failed to update vocabulary in Turso:', err);
    return false;
  }
}

/**
 * Turso 클라우드 DB에서 단어 삭제
 */
export async function deleteVocabularyFromTurso(id: string): Promise<boolean> {
  try {
    const client = getTursoClient();
    const vocabRow = await client.execute({
      sql: `SELECT learning_item_id FROM vocabularies WHERE id = ?`,
      args: [id],
    });

    const learningItemId = vocabRow.rows[0]?.learning_item_id;

    await client.execute({
      sql: `DELETE FROM vocabularies WHERE id = ?`,
      args: [id],
    });

    if (learningItemId) {
      await client.execute({
        sql: `DELETE FROM learning_items WHERE id = ?`,
        args: [String(learningItemId)],
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to delete vocabulary from Turso:', err);
    return false;
  }
}

/**
 * Turso 클라우드 DB에서 여러 단어 일괄 삭제
 */
export async function batchDeleteVocabulariesFromTurso(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  try {
    const client = getTursoClient();
    const placeholders = ids.map(() => '?').join(',');
    await client.execute({
      sql: `DELETE FROM vocabularies WHERE id IN (${placeholders})`,
      args: ids,
    });
    return true;
  } catch (err) {
    console.error('Failed to batch delete vocabularies from Turso:', err);
    return false;
  }
}

// ─────────────────────────────────────────
// 📖 숙어 (Phrases) Turso 클라우드 연동
// ─────────────────────────────────────────

/**
 * Turso 클라우드 DB에서 모든 숙어 목록 조회
 */
export async function fetchAllPhrasesFromTurso(): Promise<PhraseWithItem[] | null> {
  try {
    const client = getTursoClient();
    const res = await client.execute(`
      SELECT 
        p.id,
        p.learning_item_id as learningItemId,
        p.phrase,
        p.meaning,
        p.example_sentence as exampleSentence,
        p.example_translation as exampleTranslation,
        COALESCE(p.difficulty, 2) as difficulty,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        COALESCE(li.grade, 10) as grade,
        COALESCE(li.source, '직접 등록') as source
      FROM phrases p
      LEFT JOIN learning_items li ON p.learning_item_id = li.id
      ORDER BY p.created_at DESC
    `);

    return res.rows.map((row) => ({
      id: String(row.id),
      learningItemId: String(row.learningItemId),
      phrase: String(row.phrase),
      meaning: String(row.meaning),
      exampleSentence: row.exampleSentence ? String(row.exampleSentence) : null,
      exampleTranslation: row.exampleTranslation ? String(row.exampleTranslation) : null,
      difficulty: typeof row.difficulty === 'number' ? row.difficulty : 2,
      grade: typeof row.grade === 'number' ? row.grade : 10,
      source: row.source ? String(row.source) : '직접 등록',
      createdAt: String(row.createdAt || new Date().toISOString()),
      updatedAt: String(row.updatedAt || new Date().toISOString()),
    }));
  } catch (err) {
    console.warn('Failed to fetch phrases from Turso DB:', err);
    return null;
  }
}

/**
 * Turso 클라우드 DB에 새 숙어 등록
 */
export async function addPhraseToTurso(item: PhraseWithItem): Promise<boolean> {
  try {
    const client = getTursoClient();
    const subjectId = await ensureEnglishSubject(client);

    await client.execute({
      sql: `INSERT OR REPLACE INTO learning_items (id, subject_id, type, title, difficulty, grade, source, created_at, updated_at) VALUES (?, ?, 'phrase', ?, ?, ?, ?, ?, ?)`,
      args: [
        item.learningItemId,
        subjectId,
        item.phrase,
        item.difficulty,
        item.grade,
        item.source || '직접 등록',
        item.createdAt,
        item.updatedAt,
      ],
    });

    await client.execute({
      sql: `INSERT OR REPLACE INTO phrases (id, learning_item_id, phrase, meaning, example_sentence, example_translation, difficulty, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        item.id,
        item.learningItemId,
        item.phrase,
        item.meaning,
        item.exampleSentence,
        item.exampleTranslation,
        item.difficulty,
        item.createdAt,
        item.updatedAt,
      ],
    });

    return true;
  } catch (err) {
    console.error('Failed to add phrase to Turso:', err);
    return false;
  }
}

/**
 * Turso 클라우드 DB 숙어 정보 수정
 */
export async function updatePhraseInTurso(
  id: string,
  input: UpdatePhraseInput
): Promise<boolean> {
  try {
    const client = getTursoClient();
    const now = new Date().toISOString();

    const setClauses: string[] = ['updated_at = ?'];
    const args: (string | number | null)[] = [now];

    if (input.phrase !== undefined) {
      setClauses.push('phrase = ?');
      args.push(input.phrase);
    }
    if (input.meaning !== undefined) {
      setClauses.push('meaning = ?');
      args.push(input.meaning);
    }
    if (input.exampleSentence !== undefined) {
      setClauses.push('example_sentence = ?');
      args.push(input.exampleSentence ?? null);
    }
    if (input.exampleTranslation !== undefined) {
      setClauses.push('example_translation = ?');
      args.push(input.exampleTranslation ?? null);
    }
    if (input.difficulty !== undefined) {
      setClauses.push('difficulty = ?');
      args.push(input.difficulty);
    }

    args.push(id);
    await client.execute({
      sql: `UPDATE phrases SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    });

    return true;
  } catch (err) {
    console.error('Failed to update phrase in Turso:', err);
    return false;
  }
}

/**
 * Turso 클라우드 DB에서 숙어 삭제
 */
export async function deletePhraseFromTurso(id: string): Promise<boolean> {
  try {
    const client = getTursoClient();
    const phraseRow = await client.execute({
      sql: `SELECT learning_item_id FROM phrases WHERE id = ?`,
      args: [id],
    });

    const learningItemId = phraseRow.rows[0]?.learning_item_id;

    await client.execute({
      sql: `DELETE FROM phrases WHERE id = ?`,
      args: [id],
    });

    if (learningItemId) {
      await client.execute({
        sql: `DELETE FROM learning_items WHERE id = ?`,
        args: [String(learningItemId)],
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to delete phrase from Turso:', err);
    return false;
  }
}

/**
 * Turso 클라우드 DB에서 숙어 일괄 삭제
 */
export async function batchDeletePhrasesFromTurso(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  try {
    const client = getTursoClient();
    const placeholders = ids.map(() => '?').join(',');
    await client.execute({
      sql: `DELETE FROM phrases WHERE id IN (${placeholders})`,
      args: ids,
    });
    return true;
  } catch (err) {
    console.error('Failed to batch delete phrases from Turso:', err);
    return false;
  }
}
