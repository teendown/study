// ===========================
// Local Storage & Turso Cloud Database Hybrid Repository & Services
// ===========================
// PC & 모바일 모든 기기 간 실시간 데이터 동기화 (Turso Cloud DB + 오프라인 로컬 캐시)

import type { VocabularyWithItem, VocabularyListResult } from '../types';
import type { CreateVocabularyInput, UpdateVocabularyInput, SearchVocabularyInput } from '../schemas';
import { searchWordOnline, isValidExampleForWord, type WordSearchResult } from './dictionarySearch';
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

  let finalMeaning = input.meaning.trim();
  let finalPos = input.partOfSpeech || null;
  let finalPron = input.pronunciation || null;
  let finalEx = input.exampleSentence && isValidExampleForWord(input.exampleSentence, input.word) ? input.exampleSentence.trim() : null;
  let finalExTrans = finalEx ? (input.exampleTranslation?.trim() || null) : null;
  let finalSyn = input.synonyms || null;
  let finalAnt = input.antonyms || null;
  let finalSource = input.source || '네이버 영어사전';

  // 뜻이나 정보가 없으면 자동 사전 검색 실행
  if (!finalMeaning || finalMeaning === '의미 미입력' || finalMeaning === '의미 검색 필요') {
    try {
      const searchResult = await searchWordOnline(input.word.trim());
      if (searchResult && searchResult.meaning && searchResult.meaning !== '의미 검색 필요') {
        finalMeaning = searchResult.meaning;
        if (!finalPos && searchResult.partOfSpeech) finalPos = searchResult.partOfSpeech;
        if (!finalPron && searchResult.pronunciation) finalPron = searchResult.pronunciation;
        if (!finalEx && searchResult.exampleSentence && isValidExampleForWord(searchResult.exampleSentence, input.word)) {
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
    word: input.word.trim(),
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

  const targetWord = input.word || all[idx].word;
  const sanitizedEx = input.exampleSentence !== undefined
    ? (input.exampleSentence && isValidExampleForWord(input.exampleSentence, targetWord) ? input.exampleSentence : null)
    : all[idx].exampleSentence;

  const updated: VocabularyWithItem = {
    ...all[idx],
    ...input,
    partOfSpeech: input.partOfSpeech ?? all[idx].partOfSpeech,
    pronunciation: input.pronunciation ?? all[idx].pronunciation,
    exampleSentence: sanitizedEx,
    exampleTranslation: sanitizedEx ? (input.exampleTranslation ?? all[idx].exampleTranslation) : null,
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

export * from './phraseActions';
export * from './passageActions';
export * from './dictionarySearch';
export * from './tursoVocabService';

