// ===========================
// Local Storage & Turso Cloud Database Hybrid Repository & Services
// ===========================
// PC & 모바일 모든 기기 간 실시간 데이터 동기화 (Turso Cloud DB + 오프라인 로컬 캐시)

import type { VocabularyWithItem, VocabularyListResult } from '../types';
import type { CreateVocabularyInput, UpdateVocabularyInput, SearchVocabularyInput } from '../schemas';
import { BUILTIN_DICTIONARY, lookupWordMeaning } from '@/lib/ocr/dictionary';
import { correctOcrWordOrPhrase } from './ocrCorrectionService';
import {
  searchWordOnline,
  isValidExampleForWord,
  cleanMeaningAndExtractExample,
  type WordSearchResult,
} from './dictionarySearch';
import {
  fetchAllVocabulariesFromTurso,
  addVocabularyToTurso,
  updateVocabularyInTurso,
  deleteVocabularyFromTurso,
  batchDeleteVocabulariesFromTurso,
} from './tursoVocabService';

const STORAGE_KEY_VOCAB = 'study_quest_vocabularies_v1';

const INITIAL_VOCABULARIES: VocabularyWithItem[] = [
  {
    id: 'vocab-1',
    word: 'abandon',
    meaning: '포기하다, 버리다',
    partOfSpeech: 'v.',
    pronunciation: '[어밴던]',
    audioUrl: null,
    exampleSentence: 'He decided to abandon the risky project.',
    exampleTranslation: '그는 위험한 프로젝트를 포기하기로 결정했다.',
    synonyms: 'give up, quit, discard',
    antonyms: 'maintain, keep, retain',
    frequency: 'high',
    difficulty: 2,
    grade: 10,
    source: '고1 필수 어휘',
    learningItemId: 'item-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vocab-2',
    word: 'significant',
    meaning: '중요한, 의미심장한, 상당한',
    partOfSpeech: 'adj.',
    pronunciation: '[시그니피컨트]',
    audioUrl: null,
    exampleSentence: 'There has been a significant increase in sales.',
    exampleTranslation: '매출에 상당한 증가가 있었다.',
    synonyms: 'important, substantial, notable',
    antonyms: 'insignificant, trivial',
    frequency: 'high',
    difficulty: 3,
    grade: 10,
    source: '고1 교과서 어휘',
    learningItemId: 'item-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vocab-3',
    word: 'contribute',
    meaning: '기여하다, 공헌하다',
    partOfSpeech: 'v.',
    pronunciation: '[컨트리뷰트]',
    audioUrl: null,
    exampleSentence: 'Hard work contributed to success.',
    exampleTranslation: '노력이 성공에 기여했다.',
    synonyms: 'support, donate',
    antonyms: 'detract',
    frequency: 'high',
    difficulty: 3,
    grade: 10,
    source: '고1 필수 어휘',
    learningItemId: 'item-3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vocab-4',
    word: 'maintain',
    meaning: '유지하다, 지속하다',
    partOfSpeech: 'v.',
    pronunciation: '[메인테인]',
    audioUrl: null,
    exampleSentence: 'Maintain a good habit.',
    exampleTranslation: '좋은 습관을 유지하다.',
    synonyms: 'preserve, keep',
    antonyms: 'abandon',
    frequency: 'high',
    difficulty: 2,
    grade: 10,
    source: '고1 필수 어휘',
    learningItemId: 'item-4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vocab-5',
    word: 'environment',
    meaning: '환경, 자연',
    partOfSpeech: 'n.',
    pronunciation: '[인바이런먼트]',
    audioUrl: null,
    exampleSentence: 'Protect our environment.',
    exampleTranslation: '우리의 환경을 보호하자.',
    synonyms: 'surroundings',
    antonyms: '',
    frequency: 'high',
    difficulty: 1,
    grade: 10,
    source: '고1 교과서 어휘',
    learningItemId: 'item-5',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getStoredVocabs(): VocabularyWithItem[] {
  if (typeof window === 'undefined') return INITIAL_VOCABULARIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOCAB);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(INITIAL_VOCABULARIES));
      return INITIAL_VOCABULARIES;
    }
    const parsed: VocabularyWithItem[] = JSON.parse(raw);
    // 무관하거나 잘못 연결된 예문 데이터 자동 클린업
    return parsed.map((v) => {
      if (v.exampleSentence && !isValidExampleForWord(v.exampleSentence, v.word)) {
        return {
          ...v,
          exampleSentence: null,
          exampleTranslation: null,
        };
      }
      return v;
    });
  } catch {
    return INITIAL_VOCABULARIES;
  }
}

export function saveStoredVocabs(vocabs: VocabularyWithItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(vocabs));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 실시간 단어 검색 (온라인 사전 다단계 조회)
 */
export async function searchWordOnlineAction(
  word: string
): Promise<ActionResult<WordSearchResult>> {
  try {
    const result = await searchWordOnline(word);
    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : '단어 검색에 실패했습니다.';
    return { success: false, error: message };
  }
}

/**
 * 단어 목록 조회 (Turso Cloud DB 우선 조회 + 로컬 캐시 동기화)
 */
export async function getVocabulariesAction(
  params: Partial<SearchVocabularyInput> = {}
): Promise<ActionResult<VocabularyListResult>> {
  let all = getStoredVocabs();

  // 1. Turso Cloud DB에서 최신 데이터 조회 시도
  try {
    const tursoData = await fetchAllVocabulariesFromTurso();
    if (tursoData && tursoData.length > 0) {
      all = tursoData;
      saveStoredVocabs(all);
    } else if (tursoData && tursoData.length === 0 && all.length > 0) {
      // Turso가 비어있고 로컬에 단어가 있다면 클라우드 DB로 초기 업로드 마이그레이션
      for (const item of all) {
        addVocabularyToTurso(item).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Using local storage fallback for vocabularies:', err);
  }

  const query = (params.query || '').toLowerCase().trim();
  const filtered = all.filter(
    (v) =>
      v.word.toLowerCase().includes(query) ||
      v.meaning.includes(query) ||
      (v.source && v.source.includes(query))
  );

  return {
    success: true,
    data: {
      items: filtered,
      total: filtered.length,
      page: 1,
      limit: 100,
      totalPages: 1,
    },
  };
}

/**
 * 단어 상세 조회
 */
export async function getVocabularyByIdAction(
  id: string
): Promise<ActionResult<VocabularyWithItem>> {
  const all = getStoredVocabs();
  const found = all.find((v) => v.id === id);
  if (!found) return { success: false, error: '단어를 찾을 수 없습니다.' };
  return { success: true, data: found };
}

/**
 * 단어 등록 (Turso Cloud DB + 로컬 캐시)
 */
export async function addVocabularyAction(
  input: CreateVocabularyInput,
  allowDuplicate = false
): Promise<ActionResult<VocabularyWithItem>> {
  const all = getStoredVocabs();
  const isDuplicate = all.some(
    (v) => v.word.toLowerCase() === input.word.toLowerCase().trim()
  );
  if (!allowDuplicate && isDuplicate) {
    return { success: false, error: `"${input.word}"은(는) 이미 등록된 단어입니다.` };
  }

  // 뜻 및 예문 스마트 자동 분리 & 구두점 정제
  const targetWord = input.word.trim();
  const { meaning: cleanMeaning, exampleSentence: parsedEx, exampleTranslation: parsedExTrans } =
    cleanMeaningAndExtractExample(
      input.meaning || '',
      targetWord,
      input.exampleSentence,
      input.exampleTranslation
    );

  let finalMeaning = cleanMeaning;
  let finalPos = input.partOfSpeech || null;
  let finalPron = input.pronunciation || null;
  let finalEx = parsedEx && isValidExampleForWord(parsedEx, targetWord) ? parsedEx.trim() : null;
  let finalExTrans = finalEx ? (parsedExTrans?.trim() || null) : null;
  let finalSyn = input.synonyms || null;
  let finalAnt = input.antonyms || null;
  let finalSource = input.source || '네이버 영어사전';

  // 뜻이나 정보가 없으면 자동 사전 검색 실행
  if (!finalMeaning || finalMeaning === '의미 미입력' || finalMeaning === '의미 검색 필요') {
    try {
      const searchResult = await searchWordOnline(targetWord);
      if (searchResult && searchResult.meaning && searchResult.meaning !== '의미 검색 필요') {
        finalMeaning = searchResult.meaning;
        if (!finalPos && searchResult.partOfSpeech) finalPos = searchResult.partOfSpeech;
        if (!finalPron && searchResult.pronunciation) finalPron = searchResult.pronunciation;
        if (!finalEx && searchResult.exampleSentence && isValidExampleForWord(searchResult.exampleSentence, targetWord)) {
          finalEx = searchResult.exampleSentence;
          finalExTrans = searchResult.exampleTranslation || null;
        }
        if (!finalSyn && searchResult.synonyms) finalSyn = searchResult.synonyms;
        if (!finalAnt && searchResult.antonyms) finalAnt = searchResult.antonyms;
        if (searchResult.source) finalSource = searchResult.source;
      }
    } catch {}
  }

  const newItem: VocabularyWithItem = {
    id: `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    word: targetWord,
    meaning: finalMeaning || '의미 검색 필요',
    partOfSpeech: finalPos,
    pronunciation: finalPron,
    audioUrl: null,
    exampleSentence: finalEx,
    exampleTranslation: finalExTrans,
    synonyms: finalSyn,
    antonyms: finalAnt,
    frequency: 'high',
    difficulty: input.difficulty ?? 2,
    grade: input.grade ?? 10,
    source: finalSource,
    learningItemId: `item-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. 로컬 캐시 즉시 반영
  all.unshift(newItem);
  saveStoredVocabs(all);

  // 2. Turso Cloud DB 비동기 동기화
  addVocabularyToTurso(newItem).catch((err) => {
    console.warn('Background Turso sync failed for addVocabulary:', err);
  });

  return { success: true, data: newItem };
}

export interface BatchAddVocabItem {
  word: string;
  meaning?: string;
  partOfSpeech?: string;
  pronunciation?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  synonyms?: string;
  antonyms?: string;
  difficulty?: number;
  grade?: number;
  source?: string;
}

export interface BatchAddVocabOptions {
  duplicatePolicy?: 'skip' | 'overwrite' | 'allow';
  defaultDifficulty?: number;
  defaultSource?: string;
}

/**
 * 다중 단어 일괄 등록 (Multi-word bulk addition)
 */
export async function batchAddVocabulariesAction(
  items: BatchAddVocabItem[],
  options?: BatchAddVocabOptions
): Promise<ActionResult<{ addedCount: number; updatedCount: number; skippedCount: number; totalProcessed: number }>> {
  if (!items || items.length === 0) {
    return { success: true, data: { addedCount: 0, updatedCount: 0, skippedCount: 0, totalProcessed: 0 } };
  }

  const all = getStoredVocabs();
  const policy = options?.duplicatePolicy || 'skip';
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    const targetWord = item.word.trim();
    if (!targetWord) continue;

    const existingIdx = all.findIndex(
      (v) => v.word.toLowerCase() === targetWord.toLowerCase()
    );

    if (existingIdx !== -1) {
      if (policy === 'skip') {
        skippedCount++;
        continue;
      } else if (policy === 'overwrite') {
        // 기존 단어 업데이트
        const existing = all[existingIdx];
        const rawMeaning = item.meaning && item.meaning !== '의미 검색 필요' ? item.meaning : existing.meaning;
        const { meaning: cleanMeaning, exampleSentence: parsedEx, exampleTranslation: parsedExTrans } =
          cleanMeaningAndExtractExample(
            rawMeaning,
            targetWord,
            item.exampleSentence || existing.exampleSentence || undefined,
            item.exampleTranslation || existing.exampleTranslation || undefined
          );

        const updated: VocabularyWithItem = {
          ...existing,
          word: targetWord,
          meaning: cleanMeaning || existing.meaning,
          partOfSpeech: item.partOfSpeech || existing.partOfSpeech,
          pronunciation: item.pronunciation || existing.pronunciation,
          exampleSentence: parsedEx || existing.exampleSentence,
          exampleTranslation: parsedEx ? (parsedExTrans || existing.exampleTranslation) : existing.exampleTranslation,
          synonyms: item.synonyms || existing.synonyms,
          antonyms: item.antonyms || existing.antonyms,
          difficulty: item.difficulty ?? existing.difficulty,
          grade: item.grade ?? existing.grade,
          source: item.source || existing.source || options?.defaultSource || '다중 단어 등록',
          updatedAt: new Date().toISOString(),
        };

        all[existingIdx] = updated;
        updatedCount++;

        // Turso DB 동기화
        updateVocabularyInTurso(updated.id, {
          word: updated.word,
          meaning: updated.meaning,
          partOfSpeech: updated.partOfSpeech ?? undefined,
          pronunciation: updated.pronunciation ?? undefined,
          exampleSentence: updated.exampleSentence ?? undefined,
          exampleTranslation: updated.exampleTranslation ?? undefined,
          synonyms: updated.synonyms ?? undefined,
          antonyms: updated.antonyms ?? undefined,
        }).catch((err) => {
          console.warn('Background Turso sync failed for overwrite in batch:', err);
        });
        continue;
      }
      // If policy === 'allow', proceed to add as new below
    }

    // 신규 단어 생성
    const { meaning: cleanMeaning, exampleSentence: parsedEx, exampleTranslation: parsedExTrans } =
      cleanMeaningAndExtractExample(
        item.meaning || '',
        targetWord,
        item.exampleSentence,
        item.exampleTranslation
      );

    const finalEx = parsedEx && isValidExampleForWord(parsedEx, targetWord) ? parsedEx.trim() : null;
    const finalExTrans = finalEx ? (parsedExTrans?.trim() || null) : null;

    const newItem: VocabularyWithItem = {
      id: `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      word: targetWord,
      meaning: cleanMeaning || item.meaning || '의미 검색 필요',
      partOfSpeech: item.partOfSpeech || null,
      pronunciation: item.pronunciation || null,
      audioUrl: null,
      exampleSentence: finalEx,
      exampleTranslation: finalExTrans,
      synonyms: item.synonyms || null,
      antonyms: item.antonyms || null,
      frequency: 'high',
      difficulty: item.difficulty ?? options?.defaultDifficulty ?? 2,
      grade: item.grade ?? 10,
      source: item.source || options?.defaultSource || '다중 단어 등록',
      learningItemId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    all.unshift(newItem);
    addedCount++;

    // Turso DB 동기화
    addVocabularyToTurso(newItem).catch((err) => {
      console.warn('Background Turso sync failed for add in batch:', err);
    });
  }

  saveStoredVocabs(all);

  return {
    success: true,
    data: {
      addedCount,
      updatedCount,
      skippedCount,
      totalProcessed: items.length,
    },
  };
}

/**
 * 단어 수정
 */
export async function updateVocabularyAction(
  id: string,
  input: UpdateVocabularyInput
): Promise<ActionResult> {
  const all = getStoredVocabs();
  const idx = all.findIndex((v) => v.id === id);
  if (idx === -1) return { success: false, error: '단어를 찾을 수 없습니다.' };

  const targetWord = input.word ? input.word.trim() : all[idx].word;
  const rawMeaning = input.meaning !== undefined ? input.meaning : all[idx].meaning;
  const rawEx = input.exampleSentence !== undefined ? input.exampleSentence : (all[idx].exampleSentence || undefined);
  const rawExTrans = input.exampleTranslation !== undefined ? input.exampleTranslation : (all[idx].exampleTranslation || undefined);

  const { meaning: cleanMeaning, exampleSentence: parsedEx, exampleTranslation: parsedExTrans } =
    cleanMeaningAndExtractExample(rawMeaning, targetWord, rawEx, rawExTrans);

  const sanitizedEx = parsedEx && isValidExampleForWord(parsedEx, targetWord) ? parsedEx : null;

  const updated: VocabularyWithItem = {
    ...all[idx],
    ...input,
    word: targetWord,
    meaning: cleanMeaning || all[idx].meaning,
    partOfSpeech: input.partOfSpeech ?? all[idx].partOfSpeech,
    pronunciation: input.pronunciation ?? all[idx].pronunciation,
    exampleSentence: sanitizedEx,
    exampleTranslation: sanitizedEx ? (parsedExTrans ?? all[idx].exampleTranslation) : null,
    synonyms: input.synonyms ?? all[idx].synonyms,
    antonyms: input.antonyms ?? all[idx].antonyms,
    source: input.source ?? all[idx].source,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updated;
  saveStoredVocabs(all);

  // Turso Cloud DB 동기화
  updateVocabularyInTurso(id, input).catch((err) => {
    console.warn('Background Turso sync failed for updateVocabulary:', err);
  });

  return { success: true, data: undefined };
}

/**
 * 단어 삭제
 */
export async function deleteVocabularyAction(id: string): Promise<ActionResult> {
  const all = getStoredVocabs();
  const filtered = all.filter((v) => v.id !== id);
  if (filtered.length === all.length) {
    return { success: false, error: '삭제할 단어를 찾을 수 없습니다.' };
  }
  saveStoredVocabs(filtered);

  // Turso Cloud DB 동기화
  deleteVocabularyFromTurso(id).catch((err) => {
    console.warn('Background Turso sync failed for deleteVocabulary:', err);
  });

  return { success: true, data: undefined };
}

/**
 * 단어 일괄 삭제
 */
export async function batchDeleteVocabulariesAction(
  ids: string[]
): Promise<ActionResult<{ deletedCount: number }>> {
  const idSet = new Set(ids);
  const all = getStoredVocabs();
  const filtered = all.filter((v) => !idSet.has(v.id));
  const deletedCount = all.length - filtered.length;
  saveStoredVocabs(filtered);

  // Turso Cloud DB 동기화
  batchDeleteVocabulariesFromTurso(ids).catch((err) => {
    console.warn('Background Turso sync failed for batchDeleteVocabularies:', err);
  });

  return { success: true, data: { deletedCount } };
}

/**
 * 저장된 단어 중 뜻이 누락된 항목 일괄 자동 채우기
 */
export async function autoFillMissingVocabAction(): Promise<
  ActionResult<{ updatedCount: number; totalChecked: number }>
> {
  const all = getStoredVocabs();
  let updatedCount = 0;

  for (let i = 0; i < all.length; i++) {
    const item = all[i];
    const isMeaningMissing =
      !item.meaning ||
      item.meaning.trim() === '' ||
      item.meaning === '의미 미입력' ||
      item.meaning === '의미 검색 필요' ||
      item.meaning === '뜻 미입력';

    const isInfoIncomplete = !item.partOfSpeech || !item.pronunciation;

    if (isMeaningMissing || isInfoIncomplete) {
      try {
        const searchResult = await searchWordOnline(item.word);
        if (searchResult) {
          let changed = false;
          if (isMeaningMissing && searchResult.meaning && searchResult.meaning !== '의미 검색 필요') {
            item.meaning = searchResult.meaning;
            changed = true;
          }
          if (!item.partOfSpeech && searchResult.partOfSpeech) {
            item.partOfSpeech = searchResult.partOfSpeech;
            changed = true;
          }
          if (!item.pronunciation && searchResult.pronunciation) {
            item.pronunciation = searchResult.pronunciation;
            changed = true;
          }
          if (!item.exampleSentence && searchResult.exampleSentence && isValidExampleForWord(searchResult.exampleSentence, item.word)) {
            item.exampleSentence = searchResult.exampleSentence;
            item.exampleTranslation = searchResult.exampleTranslation || item.exampleTranslation;
            changed = true;
          }
          if (!item.synonyms && searchResult.synonyms) {
            item.synonyms = searchResult.synonyms;
            changed = true;
          }
          if (!item.antonyms && searchResult.antonyms) {
            item.antonyms = searchResult.antonyms;
            changed = true;
          }
          if (changed) {
            item.updatedAt = new Date().toISOString();
            updatedCount++;
            // Turso DB도 업데이트
            updateVocabularyInTurso(item.id, {
              meaning: item.meaning,
              partOfSpeech: item.partOfSpeech ?? undefined,
              pronunciation: item.pronunciation ?? undefined,
              exampleSentence: item.exampleSentence ?? undefined,
              exampleTranslation: item.exampleTranslation ?? undefined,
              synonyms: item.synonyms ?? undefined,
              antonyms: item.antonyms ?? undefined,
            }).catch(() => {});
          }
        }
      } catch {
        // continue
      }
    }
  }

  if (updatedCount > 0) {
    saveStoredVocabs(all);
  }

  return { success: true, data: { updatedCount, totalChecked: all.length } };
}

// 기존 명칭 하위 호환성 유지
export const autoFillMissingVocabulariesAction = autoFillMissingVocabAction;

export interface BatchFixDetail {
  id: string;
  originalWord: string;
  fixedWord: string;
  originalMeaning: string;
  fixedMeaning: string;
  reasons: string[];
}

export interface BatchFixResult {
  totalInspected: number;
  fixedCount: number;
  details: BatchFixDetail[];
}

/**
  * 선택된 단어 항목 또는 전체 단어 정밀 검사 및 결함/오류 일괄 자동 교정
  */
export async function inspectAndFixVocabulariesAction(
  targetIds?: string[]
): Promise<ActionResult<BatchFixResult>> {
  const all = getStoredVocabs();
  const idSet = targetIds && targetIds.length > 0 ? new Set(targetIds) : null;
  const targets = idSet ? all.filter((v) => idSet.has(v.id)) : [...all];

  let fixedCount = 0;
  const details: BatchFixDetail[] = [];

  for (const item of targets) {
    const idx = all.findIndex((v) => v.id === item.id);
    if (idx === -1) continue;

    const originalWord = item.word || '';
    const originalMeaning = item.meaning || '';
    const originalEx = item.exampleSentence || '';
    const originalExTrans = item.exampleTranslation || '';
    const originalPos = item.partOfSpeech || '';
    const originalPron = item.pronunciation || '';

    const reasons: string[] = [];

    // 1. 단어 철자 및 OCR 광학 오류 교정 (숫자 섞임, 오탈자 등)
    let currentWord = originalWord.trim();
    if (currentWord) {
      const ocrRes = correctOcrWordOrPhrase(currentWord);
      if (ocrRes.corrected && ocrRes.corrected !== currentWord) {
        currentWord = ocrRes.corrected;
        reasons.push(`단어 철자/OCR 교정 ("${originalWord}" ➔ "${currentWord}")`);
      } else if (/[@#$%^&*~|\\_=+<>\[\]{}]/.test(currentWord)) {
        currentWord = currentWord.replace(/[@#$%^&*~|\\_=+<>\[\]{}]/g, '').trim();
        reasons.push('단어 특수기호 오류 정제');
      }
    }

    // 2. 뜻 내 예문 혼입 정제 및 예문/예문번역 자동 분리 + 스포일러 영단어 제거 + 비정상 구두점 정리
    const { meaning: cleanedMeaning, exampleSentence: extractedEx, exampleTranslation: extractedExTrans } =
      cleanMeaningAndExtractExample(
        originalMeaning,
        currentWord,
        originalEx,
        originalExTrans
      );

    let currentMeaning = cleanedMeaning;
    let currentEx = extractedEx || originalEx || null;
    let currentExTrans = extractedExTrans || originalExTrans || null;
    let currentPos = originalPos;
    let currentPron = originalPron;

    if (cleanedMeaning !== originalMeaning) {
      if (originalMeaning.includes('That is not right') || originalMeaning.includes('feel better') || originalMeaning.includes('Read this')) {
        reasons.push('뜻 필드에 예문(영문+번역) 섞임 분리 정제');
      } else if (originalMeaning.includes('과거분사') || originalMeaning.includes('현재분사')) {
        reasons.push('문법 설명 단독 표기 정제');
      } else {
        reasons.push('뜻 구두점 및 단어 스포일러 정제');
      }
    }
    if (extractedEx && extractedEx !== originalEx) {
      reasons.push('예문 텍스트 자동 분리');
    }

    // 3. 누락되었거나 불완전한 뜻, 품사, 발음 자동 복원
    const isMeaningMissing =
      !currentMeaning ||
      currentMeaning.trim() === '' ||
      currentMeaning === '의미 미입력' ||
      currentMeaning === '의미 검색 필요' ||
      currentMeaning === '뜻 미입력' ||
      !/[가-힣]/.test(currentMeaning);

    const isInfoMissing = !currentPos || !currentPron;

    if (isMeaningMissing || isInfoMissing) {
      // 내장 사전 우선 검색
      const builtin = lookupWordMeaning(currentWord.toLowerCase()) || BUILTIN_DICTIONARY[currentWord.toLowerCase()];
      if (builtin && builtin.meaning) {
        if (isMeaningMissing) {
          currentMeaning = builtin.meaning;
          reasons.push('내장 사전을 통해 의미 복원');
        }
        if (!currentPos && builtin.pos) currentPos = builtin.pos;
        if (!currentPron && builtin.pron) currentPron = builtin.pron;
      }

      // 온라인 사전 검색 (필요시)
      if ((!currentMeaning || currentMeaning === '의미 검색 필요' || isInfoMissing) && currentWord) {
        try {
          const searchRes = await searchWordOnline(currentWord);
          if (searchRes) {
            if ((!currentMeaning || currentMeaning === '의미 검색 필요') && searchRes.meaning) {
              currentMeaning = searchRes.meaning;
              reasons.push('온라인 사전에서 누락된 뜻 자동 수집');
            }
            if (!currentPos && searchRes.partOfSpeech) {
              currentPos = searchRes.partOfSpeech;
              reasons.push('누락된 품사(Part of Speech) 보충');
            }
            if (!currentPron && searchRes.pronunciation) {
              currentPron = searchRes.pronunciation;
              reasons.push('누락된 한글 발음 표기 보충');
            }
            if (!currentEx && searchRes.exampleSentence && isValidExampleForWord(searchRes.exampleSentence, currentWord)) {
              currentEx = searchRes.exampleSentence;
              currentExTrans = searchRes.exampleTranslation || currentExTrans;
              reasons.push('추가 예문 자동 등록');
            }
          }
        } catch {}
      }
    }

    // 변경 여부 확인
    const isChanged =
      currentWord !== originalWord ||
      currentMeaning !== originalMeaning ||
      (currentEx || '') !== (originalEx || '') ||
      (currentExTrans || '') !== (originalExTrans || '') ||
      currentPos !== originalPos ||
      currentPron !== originalPron;

    if (isChanged && reasons.length > 0) {
      fixedCount++;
      const updatedItem: VocabularyWithItem = {
        ...all[idx],
        word: currentWord,
        meaning: currentMeaning,
        exampleSentence: currentEx,
        exampleTranslation: currentExTrans,
        partOfSpeech: currentPos || null,
        pronunciation: currentPron || null,
        updatedAt: new Date().toISOString(),
      };

      all[idx] = updatedItem;
      details.push({
        id: item.id,
        originalWord,
        fixedWord: currentWord,
        originalMeaning,
        fixedMeaning: currentMeaning,
        reasons,
      });

      // Turso DB 동기화
      updateVocabularyInTurso(item.id, {
        word: currentWord,
        meaning: currentMeaning,
        partOfSpeech: currentPos || undefined,
        pronunciation: currentPron || undefined,
        exampleSentence: currentEx || undefined,
        exampleTranslation: currentExTrans || undefined,
      }).catch(() => {});
    }
  }

  if (fixedCount > 0) {
    saveStoredVocabs(all);
  }

  return {
    success: true,
    data: {
      totalInspected: targets.length,
      fixedCount,
      details,
    },
  };
}

export * from './phraseActions';
export * from './passageActions';
export * from './dictionarySearch';
export * from './tursoVocabService';


