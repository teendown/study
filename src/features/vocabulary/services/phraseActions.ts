// ===========================
// Phrase Local Storage Services
// ===========================

import type { PhraseWithItem, PhraseListResult } from '../types/phraseTypes';
import type { CreatePhraseInput, UpdatePhraseInput, SearchPhraseInput } from '../schemas/phraseSchemas';
import { searchWordOnline, type WordSearchResult } from './dictionarySearch';

const STORAGE_KEY_PHRASE = 'study_quest_phrases_v1';

const INITIAL_PHRASES: PhraseWithItem[] = [
  {
    id: 'phrase-1',
    phrase: 'look forward to',
    meaning: '~를 고대하다, 기대하다',
    exampleSentence: 'I look forward to seeing you soon.',
    exampleTranslation: '곧 당신을 만나기를 고대합니다.',
    difficulty: 2,
    grade: 10,
    source: '고1 필수 숙어',
    learningItemId: 'p-item-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'phrase-2',
    phrase: 'take part in',
    meaning: '~에 참여하다, 참가하다',
    exampleSentence: 'Many students took part in the contest.',
    exampleTranslation: '많은 학생들이 그 대회에 참가했다.',
    difficulty: 1,
    grade: 10,
    source: '고1 필수 숙어',
    learningItemId: 'p-item-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'phrase-3',
    phrase: 'carry out',
    meaning: '수행하다, 실행하다',
    exampleSentence: 'They carried out the scientific experiment.',
    exampleTranslation: '그들은 과학 실험을 수행했다.',
    difficulty: 3,
    grade: 10,
    source: '고1 교과서 숙어',
    learningItemId: 'p-item-3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getStoredPhrases(): PhraseWithItem[] {
  if (typeof window === 'undefined') return INITIAL_PHRASES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PHRASE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PHRASE, JSON.stringify(INITIAL_PHRASES));
      return INITIAL_PHRASES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PHRASES;
  }
}

function saveStoredPhrases(items: PhraseWithItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PHRASE, JSON.stringify(items));
  } catch {}
}

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getPhrasesAction(
  params: Partial<SearchPhraseInput> = {}
): Promise<ActionResult<PhraseListResult>> {
  const all = getStoredPhrases();
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

export async function addPhraseAction(
  input: CreatePhraseInput
): Promise<ActionResult<PhraseWithItem>> {
  const all = getStoredPhrases();
  const newItem: PhraseWithItem = {
    id: `phrase-${Date.now()}`,
    phrase: input.phrase.trim(),
    meaning: input.meaning.trim(),
    exampleSentence: input.exampleSentence || null,
    exampleTranslation: input.exampleTranslation || null,
    difficulty: input.difficulty ?? 2,
    grade: input.grade ?? 10,
    source: input.source || '직접 등록',
    learningItemId: `pitem-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  all.unshift(newItem);
  saveStoredPhrases(all);
  return { success: true, data: newItem };
}

export async function updatePhraseAction(
  id: string,
  input: UpdatePhraseInput
): Promise<ActionResult> {
  const all = getStoredPhrases();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return { success: false, error: '숙어를 찾을 수 없습니다.' };

  all[idx] = {
    ...all[idx],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  saveStoredPhrases(all);
  return { success: true, data: undefined };
}

export async function deletePhraseAction(id: string): Promise<ActionResult> {
  const all = getStoredPhrases();
  const filtered = all.filter((p) => p.id !== id);
  saveStoredPhrases(filtered);
  return { success: true, data: undefined };
}

export async function batchDeletePhrasesAction(
  ids: string[]
): Promise<ActionResult<{ deletedCount: number }>> {
  const idSet = new Set(ids);
  const all = getStoredPhrases();
  const filtered = all.filter((p) => !idSet.has(p.id));
  const deletedCount = all.length - filtered.length;
  saveStoredPhrases(filtered);
  return { success: true, data: { deletedCount } };
}

export async function autoFillMissingPhrasesAction(): Promise<
  ActionResult<{ updatedCount: number; totalChecked: number }>
> {
  const all = getStoredPhrases();
  let updatedCount = 0;

  for (let i = 0; i < all.length; i++) {
    const item = all[i];
    const isMeaningMissing =
      !item.meaning ||
      item.meaning.trim() === '' ||
      item.meaning === '의미 미입력' ||
      item.meaning === '의미 검색 필요' ||
      item.meaning === '뜻 미입력';

    const isExampleMissing = !item.exampleSentence;

    if (isMeaningMissing || isExampleMissing) {
      try {
        const searchResult = await searchWordOnline(item.phrase);
        if (searchResult) {
          let changed = false;
          if (isMeaningMissing && searchResult.meaning && searchResult.meaning !== '의미 검색 필요') {
            item.meaning = searchResult.meaning;
            changed = true;
          }
          if (!item.exampleSentence && searchResult.exampleSentence) {
            item.exampleSentence = searchResult.exampleSentence;
            item.exampleTranslation = searchResult.exampleTranslation || item.exampleTranslation;
            changed = true;
          }
          if (changed) {
            item.updatedAt = new Date().toISOString();
            updatedCount++;
          }
        }
      } catch {}
    }
  }

  if (updatedCount > 0) {
    saveStoredPhrases(all);
  }

  return { success: true, data: { updatedCount, totalChecked: all.length } };
}

export async function searchPhraseOnlineAction(
  phrase: string
): Promise<ActionResult<WordSearchResult>> {
  try {
    const result = await searchWordOnline(phrase);
    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : '숙어 검색에 실패했습니다.';
    return { success: false, error: message };
  }
}



