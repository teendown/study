// ===========================
// Phrase Actions & Services (Turso Cloud DB & Local Storage Hybrid)
// ===========================

import type { PhraseWithItem, PhraseListResult } from '../types/phraseTypes';
import type { CreatePhraseInput, UpdatePhraseInput, SearchPhraseInput } from '../schemas/phraseSchemas';
import {
  searchWordOnline,
  searchPhraseOnline,
  isValidExampleForWord,
  cleanMeaningAndExtractExample,
  type WordSearchResult,
} from './dictionarySearch';
import {
  fetchAllPhrasesFromTurso,
  addPhraseToTurso,
  updatePhraseInTurso,
  deletePhraseFromTurso,
  batchDeletePhrasesFromTurso,
} from './tursoVocabService';

const STORAGE_KEY_PHRASE = 'study_quest_phrases_v1';

const INITIAL_PHRASES: PhraseWithItem[] = [
  {
    id: 'phrase-1',
    phrase: 'take care of',
    meaning: '~을 돌보다, 처리하다',
    exampleSentence: 'Please take care of my dog while I am away.',
    exampleTranslation: '내가 없는 동안 내 개를 돌봐줘.',
    difficulty: 1,
    grade: 10,
    source: '기본 숙어',
    learningItemId: 'pitem-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'phrase-2',
    phrase: 'look forward to',
    meaning: '~을 고대하다, 기대하다',
    exampleSentence: 'I look forward to meeting you soon.',
    exampleTranslation: '곧 당신을 만나기를 기대합니다.',
    difficulty: 2,
    grade: 10,
    source: '기본 숙어',
    learningItemId: 'pitem-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'phrase-3',
    phrase: 'run out of',
    meaning: '~이 바닥나다, 다 떨어지다',
    exampleSentence: 'We ran out of milk this morning.',
    exampleTranslation: '오늘 아침에 우유가 다 떨어졌다.',
    difficulty: 2,
    grade: 10,
    source: '기본 숙어',
    learningItemId: 'pitem-3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'phrase-4',
    phrase: 'give up',
    meaning: '포기하다',
    exampleSentence: 'Never give up on your dreams.',
    exampleTranslation: '당신의 꿈을 절대 포기하지 마세요.',
    difficulty: 1,
    grade: 10,
    source: '기본 숙어',
    learningItemId: 'pitem-4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'phrase-5',
    phrase: 'put off',
    meaning: '연기하다, 미루다',
    exampleSentence: 'Don’t put off what you can do today.',
    exampleTranslation: '오늘 할 수 있는 일을 미루지 마라.',
    difficulty: 2,
    grade: 10,
    source: '기본 숙어',
    learningItemId: 'pitem-5',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getStoredPhrases(): PhraseWithItem[] {
  if (typeof window === 'undefined') return INITIAL_PHRASES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PHRASE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PHRASE, JSON.stringify(INITIAL_PHRASES));
      return INITIAL_PHRASES;
    }
    const parsed: PhraseWithItem[] = JSON.parse(raw);
    // 무관하거나 잘못 연결된 예문 데이터 자동 클린업
    return parsed.map((p) => {
      if (p.exampleSentence && !isValidExampleForWord(p.exampleSentence, p.phrase)) {
        return {
          ...p,
          exampleSentence: null,
          exampleTranslation: null,
        };
      }
      return p;
    });
  } catch {
    return INITIAL_PHRASES;
  }
}

export function saveStoredPhrases(items: PhraseWithItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PHRASE, JSON.stringify(items));
  } catch {}
}

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 숙어 목록 조회 (Turso Cloud DB 우선 조회 + 로컬 캐시 동기화)
 */
export async function getPhrasesAction(
  params: Partial<SearchPhraseInput> = {}
): Promise<ActionResult<PhraseListResult>> {
  let all = getStoredPhrases();

  try {
    const tursoData = await fetchAllPhrasesFromTurso();
    if (tursoData && tursoData.length > 0) {
      all = tursoData;
      saveStoredPhrases(all);
    } else if (tursoData && tursoData.length === 0 && all.length > 0) {
      for (const item of all) {
        addPhraseToTurso(item).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Using local storage fallback for phrases:', err);
  }

  const query = (params.query || '').toLowerCase().trim();
  const filtered = all.filter(
    (p) =>
      p.phrase.toLowerCase().includes(query) ||
      p.meaning.includes(query) ||
      (p.source && p.source.includes(query))
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
 * 숙어 등록
 */
export async function addPhraseAction(
  input: CreatePhraseInput,
  allowDuplicate = false
): Promise<ActionResult<PhraseWithItem>> {
  const all = getStoredPhrases();
  const isDuplicate = all.some(
    (p) => p.phrase.toLowerCase() === input.phrase.toLowerCase().trim()
  );
  if (!allowDuplicate && isDuplicate) {
    return { success: false, error: `"${input.phrase}"은(는) 이미 등록된 숙어입니다.` };
  }

  // 뜻 및 예문 스마트 자동 분리 & 구두점 정제
  const targetPhrase = input.phrase.trim();
  const { meaning: cleanMeaning, exampleSentence: parsedEx, exampleTranslation: parsedExTrans } =
    cleanMeaningAndExtractExample(
      input.meaning || '',
      targetPhrase,
      input.exampleSentence,
      input.exampleTranslation
    );

  let finalMeaning = cleanMeaning;
  let finalEx = parsedEx && isValidExampleForWord(parsedEx, targetPhrase) ? parsedEx.trim() : null;
  let finalExTrans = finalEx ? (parsedExTrans?.trim() || null) : null;
  let finalSource = input.source || '네이버 영어사전';

  if (!finalMeaning || finalMeaning === '의미 미입력' || finalMeaning === '의미 검색 필요') {
    try {
      const searchResult = await searchWordOnline(targetPhrase);
      if (searchResult && searchResult.meaning && searchResult.meaning !== '의미 검색 필요') {
        finalMeaning = searchResult.meaning;
        if (!finalEx && searchResult.exampleSentence && isValidExampleForWord(searchResult.exampleSentence, targetPhrase)) {
          finalEx = searchResult.exampleSentence;
          finalExTrans = searchResult.exampleTranslation || null;
        }
        if (searchResult.source) finalSource = searchResult.source;
      }
    } catch {}
  }

  const newItem: PhraseWithItem = {
    id: `phrase-${Date.now()}`,
    phrase: targetPhrase,
    meaning: finalMeaning || '의미 검색 필요',
    exampleSentence: finalEx,
    exampleTranslation: finalExTrans,
    difficulty: input.difficulty ?? 2,
    grade: input.grade ?? 10,
    source: finalSource,
    learningItemId: `pitem-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  all.unshift(newItem);
  saveStoredPhrases(all);

  // Turso Cloud DB 동기화
  addPhraseToTurso(newItem).catch((err) => {
    console.warn('Background Turso sync failed for addPhrase:', err);
  });

  return { success: true, data: newItem };
}

/**
 * 숙어 수정
 */
export async function updatePhraseAction(
  id: string,
  input: UpdatePhraseInput
): Promise<ActionResult> {
  const all = getStoredPhrases();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return { success: false, error: '숙어를 찾을 수 없습니다.' };

  const targetPhrase = input.phrase ? input.phrase.trim() : all[idx].phrase;
  const rawMeaning = input.meaning !== undefined ? input.meaning : all[idx].meaning;
  const rawEx = input.exampleSentence !== undefined ? input.exampleSentence : (all[idx].exampleSentence || undefined);
  const rawExTrans = input.exampleTranslation !== undefined ? input.exampleTranslation : (all[idx].exampleTranslation || undefined);

  const { meaning: cleanMeaning, exampleSentence: parsedEx, exampleTranslation: parsedExTrans } =
    cleanMeaningAndExtractExample(rawMeaning, targetPhrase, rawEx, rawExTrans);

  const sanitizedEx = parsedEx && isValidExampleForWord(parsedEx, targetPhrase) ? parsedEx : null;

  all[idx] = {
    ...all[idx],
    ...input,
    phrase: targetPhrase,
    meaning: cleanMeaning || all[idx].meaning,
    exampleSentence: sanitizedEx,
    exampleTranslation: sanitizedEx ? (parsedExTrans ?? all[idx].exampleTranslation) : null,
    updatedAt: new Date().toISOString(),
  };
  saveStoredPhrases(all);

  // Turso Cloud DB 동기화
  updatePhraseInTurso(id, input).catch((err) => {
    console.warn('Background Turso sync failed for updatePhrase:', err);
  });

  return { success: true, data: undefined };
}

/**
 * 숙어 삭제
 */
export async function deletePhraseAction(id: string): Promise<ActionResult> {
  const all = getStoredPhrases();
  const filtered = all.filter((p) => p.id !== id);
  if (filtered.length === all.length) {
    return { success: false, error: '삭제할 숙어를 찾을 수 없습니다.' };
  }
  saveStoredPhrases(filtered);

  // Turso Cloud DB 동기화
  deletePhraseFromTurso(id).catch((err) => {
    console.warn('Background Turso sync failed for deletePhrase:', err);
  });

  return { success: true, data: undefined };
}

/**
 * 숙어 일괄 삭제
 */
export async function batchDeletePhrasesAction(
  ids: string[]
): Promise<ActionResult<{ deletedCount: number }>> {
  const idSet = new Set(ids);
  const all = getStoredPhrases();
  const filtered = all.filter((p) => !idSet.has(p.id));
  const deletedCount = all.length - filtered.length;
  saveStoredPhrases(filtered);

  // Turso Cloud DB 동기화
  batchDeletePhrasesFromTurso(ids).catch((err) => {
    console.warn('Background Turso sync failed for batchDeletePhrases:', err);
  });

  return { success: true, data: { deletedCount } };
}

/**
 * 숙어 온라인 자동 검색
 */
export async function searchPhraseOnlineAction(
  phrase: string
): Promise<ActionResult<WordSearchResult>> {
  try {
    const result = await searchPhraseOnline(phrase);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: '숙어 검색에 실패했습니다.' };
  }
}

/**
 * 저장된 숙어 중 뜻이 누락된 항목 일괄 자동 채우기
 */
export async function autoFillMissingPhrasesAction(): Promise<
  ActionResult<{ updatedCount: number; totalChecked: number }>
> {
  const all = getStoredPhrases();
  let updatedCount = 0;

  for (let i = 0; i < all.length; i++) {
    const item = all[i];
    const isMissing =
      !item.meaning ||
      item.meaning.trim() === '' ||
      item.meaning === '의미 미입력' ||
      item.meaning === '의미 검색 필요' ||
      item.meaning === '뜻 미입력' ||
      item.meaning.includes('비표준 어휘 / 철자 확인 필요');

    if (isMissing) {
      try {
        const searchRes = await searchPhraseOnline(item.phrase);
        if (searchRes && searchRes.meaning && searchRes.meaning !== '의미 검색 필요' && !searchRes.meaning.includes('비표준 어휘')) {
          item.meaning = searchRes.meaning;
          if (!item.exampleSentence && searchRes.exampleSentence) {
            item.exampleSentence = searchRes.exampleSentence;
            item.exampleTranslation = searchRes.exampleTranslation || item.exampleTranslation;
          }
          item.updatedAt = new Date().toISOString();
          updatedCount++;

          updatePhraseInTurso(item.id, {
            meaning: item.meaning,
            exampleSentence: item.exampleSentence ?? undefined,
            exampleTranslation: item.exampleTranslation ?? undefined,
          }).catch(() => {});
        }
      } catch {}
    }
  }

  if (updatedCount > 0) {
    saveStoredPhrases(all);
  }

  return { success: true, data: { updatedCount, totalChecked: all.length } };
}
