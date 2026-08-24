// ===========================
// Local Storage Client Repository & Services
// ===========================
// GitHub Pages 정적 호스팅 완벽 호환을 위한 브라우저 로컬 저장소 매니저

import type { VocabularyWithItem, VocabularyListResult } from '../types';
import type { CreateVocabularyInput, UpdateVocabularyInput, SearchVocabularyInput } from '../schemas';
import type { WordSearchResult } from './dictionarySearch';
import { searchWordOnline } from './dictionarySearch';

const STORAGE_KEY_VOCAB = 'study_quest_vocabularies_v1';

const INITIAL_VOCABULARIES: VocabularyWithItem[] = [
  {
    id: 'vocab-1',
    word: 'abandon',
    meaning: '포기하다, 버리다',
    partOfSpeech: 'v.',
    pronunciation: '[əˈbændən]',
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
    pronunciation: '[sɪɡˈnɪfɪkənt]',
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
    pronunciation: '[kənˈtrɪbjuːt]',
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
    pronunciation: '[meɪnˈteɪn]',
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
    pronunciation: '[ɪnˈvaɪrənmənt]',
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

function getStoredVocabs(): VocabularyWithItem[] {
  if (typeof window === 'undefined') return INITIAL_VOCABULARIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOCAB);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(INITIAL_VOCABULARIES));
      return INITIAL_VOCABULARIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_VOCABULARIES;
  }
}

function saveStoredVocabs(vocabs: VocabularyWithItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(vocabs));
  } catch {}
}

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 인터넷 온라인 사전 자동 검색
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
 * 단어 목록 조회
 */
export async function getVocabulariesAction(
  params: Partial<SearchVocabularyInput> = {}
): Promise<ActionResult<VocabularyListResult>> {
  const all = getStoredVocabs();
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
 * 단어 등록
 */
export async function addVocabularyAction(
  input: CreateVocabularyInput
): Promise<ActionResult<VocabularyWithItem>> {
  const all = getStoredVocabs();
  const isDuplicate = all.some(
    (v) => v.word.toLowerCase() === input.word.toLowerCase().trim()
  );
  if (isDuplicate) {
    return { success: false, error: `"${input.word}"은(는) 이미 등록된 단어입니다.` };
  }

  let finalMeaning = input.meaning.trim();
  let finalPos = input.partOfSpeech || null;
  let finalPron = input.pronunciation || null;
  let finalEx = input.exampleSentence || null;
  let finalExTrans = input.exampleTranslation || null;
  let finalSyn = input.synonyms || null;
  let finalAnt = input.antonyms || null;
  let finalSource = input.source || '직접 등록';

  // 뜻이나 정보가 없으면 자동 사전 검색 실행
  if (!finalMeaning || finalMeaning === '의미 미입력' || finalMeaning === '의미 검색 필요') {
    try {
      const searchResult = await searchWordOnline(input.word.trim());
      if (searchResult && searchResult.meaning && searchResult.meaning !== '의미 검색 필요') {
        finalMeaning = searchResult.meaning;
        if (!finalPos && searchResult.partOfSpeech) finalPos = searchResult.partOfSpeech;
        if (!finalPron && searchResult.pronunciation) finalPron = searchResult.pronunciation;
        if (!finalEx && searchResult.exampleSentence) finalEx = searchResult.exampleSentence;
        if (!finalExTrans && searchResult.exampleTranslation) finalExTrans = searchResult.exampleTranslation;
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

  all.unshift(newItem);
  saveStoredVocabs(all);
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
  if (idx === -1) return { success: false, error: '수정할 단어를 찾을 수 없습니다.' };

  const updated: VocabularyWithItem = {
    ...all[idx],
    ...input,
    partOfSpeech: input.partOfSpeech || all[idx].partOfSpeech,
    pronunciation: input.pronunciation || all[idx].pronunciation,
    exampleSentence: input.exampleSentence || all[idx].exampleSentence,
    exampleTranslation: input.exampleTranslation || all[idx].exampleTranslation,
    synonyms: input.synonyms || all[idx].synonyms,
    antonyms: input.antonyms || all[idx].antonyms,
    source: input.source || all[idx].source,
    difficulty: input.difficulty ?? all[idx].difficulty,
    grade: input.grade ?? all[idx].grade,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updated;
  saveStoredVocabs(all);
  return { success: true, data: undefined };
}

/**
 * 단어 삭제
 */
export async function deleteVocabularyAction(id: string): Promise<ActionResult> {
  const all = getStoredVocabs();
  const filtered = all.filter((v) => v.id !== id);
  saveStoredVocabs(filtered);
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
  return { success: true, data: { deletedCount } };
}

/**
 * 저장된 단어 중 뜻이나 정보가 누락된 단어들을 자동으로 검색하여 채워넣기 (단어 자동 치유 & 보강)
 */
export async function autoFillMissingVocabulariesAction(): Promise<
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

    const isInfoIncomplete = !item.partOfSpeech || !item.pronunciation || !item.exampleSentence;

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
          if (!item.exampleSentence && searchResult.exampleSentence) {
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

export * from './phraseActions';
export * from './dictionarySearch';



