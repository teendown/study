// ===========================
// Reading Passage Actions & Services (Turso Cloud DB & Local Storage Hybrid)
// ===========================

import type {
  PassageItem,
  PassageListResult,
  CreatePassageInput,
  UpdatePassageInput,
  ExtractedPhraseItem,
} from '../types/passageTypes';
import { splitPassageIntoSentences } from '@/lib/ocr/textCleaner';
import { extractEnglishWords } from '@/lib/ocr/tokenizer';
import { extractEnglishPhrases } from '@/lib/ocr/phraseDictionary';
import { getTursoClient } from './tursoVocabService';

const STORAGE_KEY_PASSAGES = 'study_quest_passages_v1';

const INITIAL_PASSAGES: PassageItem[] = [
  {
    id: 'passage-1',
    title: 'The Power of Habit (습관의 힘)',
    content: `Habits are the small decisions you make and actions you perform every day. According to researchers, habits account for about 40 percent of our behaviors on any given day. Your life today is essentially the sum of your habits. How in shape or out of shape you are? A result of your habits. How happy or unhappy you are? A result of your habits. What you repeatedly do ultimately forms the person you are, the things you believe, and the personality that you portray. By changing your daily habits, you can transform your entire life.`,
    translation: '습관은 여러분이 매일 내리는 작은 결정과 행동들입니다. 연구원들에 따르면, 습관은 하루 행동의 약 40퍼센트를 차지합니다. 여러분의 오늘의 삶은 본질적으로 습관의 총합입니다. 당신이 얼마나 건강한지, 행복한지는 모두 습관의 결과입니다. 매일의 습관을 바꿈으로써 여러분은 인생 전체를 변화시킬 수 있습니다.',
    sentences: [
      'Habits are the small decisions you make and actions you perform every day.',
      'According to researchers, habits account for about 40 percent of our behaviors on any given day.',
      'Your life today is essentially the sum of your habits.',
      'How in shape or out of shape you are? A result of your habits.',
      'How happy or unhappy you are? A result of your habits.',
      'What you repeatedly do ultimately forms the person you are, the things you believe, and the personality that you portray.',
      'By changing your daily habits, you can transform your entire life.',
    ],
    vocabularyList: [
      'habit', 'decision', 'perform', 'researcher', 'behavior',
      'essentially', 'ultimately', 'transform', 'repeatedly', 'portray',
      'percent', 'personality', 'believe', 'action',
    ],
    phraseList: [
      { phrase: 'every day', matchedText: 'every day', meaning: '매일, 날마다', difficulty: 1 },
      { phrase: 'according to', matchedText: 'According to', meaning: '~에 따르면, ~에 의하면', difficulty: 1 },
      { phrase: 'account for', matchedText: 'account for', meaning: '~을 설명하다, (비율을) 차지하다', difficulty: 2 },
      { phrase: 'in shape', matchedText: 'in shape', meaning: '건강한, 몸 상태가 좋은', difficulty: 2 },
    ],
    difficulty: 2,
    grade: 10,
    source: '고1 영어 모의고사',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'passage-2',
    title: 'Protecting the Global Environment (지구 환경 보호)',
    content: `Climate change is one of the most pressing challenges of our time. Global temperatures have risen significantly due to human activities, especially the burning of fossil fuels. This warming trend causes extreme weather events, rising sea levels, and loss of biodiversity. However, there is still hope if we take immediate collective action. Transitioning to renewable energy sources, such as solar and wind power, can drastically reduce greenhouse gas emissions. Every small effort to conserve energy in our daily lives contributes to a sustainable future.`,
    translation: '기후 변화는 우리 시대의 가장 시급한 과제 중 하나입니다. 인간의 활동, 특히 화석 연료 연소로 인해 지구 기온이 크게 상승했습니다. 이러한 온난화 추세는 극단적인 기상 이변, 해수면 상승, 생물 다양성 손실을 초래합니다. 그러나 우리가 즉각적이고 공동의 행동을 취한다면 여전히 희망이 있습니다.',
    sentences: [
      'Climate change is one of the most pressing challenges of our time.',
      'Global temperatures have risen significantly due to human activities, especially the burning of fossil fuels.',
      'This warming trend causes extreme weather events, rising sea levels, and loss of biodiversity.',
      'However, there is still hope if we take immediate collective action.',
      'Transitioning to renewable energy sources, such as solar and wind power, can drastically reduce greenhouse gas emissions.',
      'Every small effort to conserve energy in our daily lives contributes to a sustainable future.',
    ],
    vocabularyList: [
      'climate', 'pressing', 'challenge', 'temperature', 'significantly',
      'activity', 'especially', 'fossil', 'warming', 'trend',
      'extreme', 'weather', 'biodiversity', 'immediate', 'collective',
      'transition', 'renewable', 'energy', 'source', 'drastically',
      'reduce', 'greenhouse', 'emission', 'effort', 'conserve', 'sustainable',
    ],
    phraseList: [
      { phrase: 'climate change', matchedText: 'Climate change', meaning: '기후 변화', difficulty: 1 },
      { phrase: 'due to', matchedText: 'due to', meaning: '~로 인하여, ~때문에', difficulty: 1 },
      { phrase: 'fossil fuel', matchedText: 'fossil fuels', meaning: '화석 연료', difficulty: 1 },
      { phrase: 'take action', matchedText: 'take immediate collective action', meaning: '조치를 취하다, 행동에 나서다', difficulty: 2 },
      { phrase: 'such as', matchedText: 'such as', meaning: '~와 같은', difficulty: 1 },
      { phrase: 'greenhouse gas', matchedText: 'greenhouse gas', meaning: '온실가스', difficulty: 2 },
      { phrase: 'daily life', matchedText: 'daily lives', meaning: '일상 생활', difficulty: 1 },
      { phrase: 'contribute to', matchedText: 'contributes to', meaning: '~에 기여하다, 원인이 되다', difficulty: 2 },
    ],
    difficulty: 3,
    grade: 10,
    source: '고1 수능특강 영어',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getStoredPassages(): PassageItem[] {
  if (typeof window === 'undefined') return INITIAL_PASSAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PASSAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PASSAGES, JSON.stringify(INITIAL_PASSAGES));
      return INITIAL_PASSAGES;
    }
    const parsed: PassageItem[] = JSON.parse(raw);
    // phraseList 누락된 기존 저장 데이터 자동 보정
    return parsed.map((item) => {
      if (!item.phraseList || item.phraseList.length === 0) {
        return {
          ...item,
          phraseList: extractEnglishPhrases(item.content),
        };
      }
      return item;
    });
  } catch {
    return INITIAL_PASSAGES;
  }
}

export function saveStoredPassages(items: PassageItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PASSAGES, JSON.stringify(items));
  } catch {}
}

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Turso Cloud DB에서 지문 목록 조회
 */
export async function fetchAllPassagesFromTurso(): Promise<PassageItem[] | null> {
  try {
    const client = getTursoClient();
    const res = await client.execute(`
      SELECT id, title, content, difficulty, grade, source, metadata, created_at, updated_at
      FROM learning_items
      WHERE type = 'reading'
      ORDER BY created_at DESC
    `);

    return res.rows.map((row) => {
      let meta: {
        translation?: string;
        sentences?: string[];
        sentenceTranslations?: string[];
        vocabularyList?: string[];
        phraseList?: ExtractedPhraseItem[];
        handwritingNotes?: Record<string, string>;
      } = {};
      try {
        if (row.metadata) {
          meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata as typeof meta);
        }
      } catch {}

      const content = String(row.content || '');
      const sentences = meta.sentences && meta.sentences.length > 0 ? meta.sentences : splitPassageIntoSentences(content);
      // 단어 개수 제한 없이 모든 단어 추출
      const vocabularyList = meta.vocabularyList && meta.vocabularyList.length > 0
        ? meta.vocabularyList
        : extractEnglishWords(content).map((w) => w.word);
      // 숙어/연어 자동 추출
      const phraseList = meta.phraseList && meta.phraseList.length > 0
        ? meta.phraseList
        : extractEnglishPhrases(content);

      return {
        id: String(row.id),
        title: String(row.title),
        content,
        translation: meta.translation || null,
        sentences,
        sentenceTranslations: meta.sentenceTranslations || undefined,
        vocabularyList,
        phraseList,
        difficulty: typeof row.difficulty === 'number' ? row.difficulty : 2,
        grade: typeof row.grade === 'number' ? row.grade : 10,
        source: row.source ? String(row.source) : '교재 지문',
        handwritingNotes: meta.handwritingNotes,
        createdAt: String(row.created_at || new Date().toISOString()),
        updatedAt: String(row.updated_at || new Date().toISOString()),
      };
    });
  } catch (err) {
    console.warn('Failed to fetch passages from Turso DB:', err);
    return null;
  }
}

/**
 * Turso Cloud DB에 지문 추가/동기화
 */
export async function addPassageToTurso(item: PassageItem): Promise<boolean> {
  try {
    const client = getTursoClient();
    const metaJson = JSON.stringify({
      translation: item.translation,
      sentences: item.sentences,
      sentenceTranslations: item.sentenceTranslations,
      vocabularyList: item.vocabularyList,
      phraseList: item.phraseList,
      handwritingNotes: item.handwritingNotes,
    });

    await client.execute({
      sql: `INSERT OR REPLACE INTO learning_items (id, subject_id, type, title, content, difficulty, grade, source, metadata, created_at, updated_at) VALUES (?, 'sub-english', 'reading', ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        item.id,
        item.title,
        item.content,
        item.difficulty,
        item.grade || 10,
        item.source,
        metaJson,
        item.createdAt,
        item.updatedAt,
      ],
    });
    return true;
  } catch (err) {
    console.warn('Failed to save passage to Turso DB:', err);
    return false;
  }
}

/**
 * Turso Cloud DB에서 지문 삭제
 */
export async function deletePassageFromTurso(id: string): Promise<boolean> {
  try {
    const client = getTursoClient();
    await client.execute({
      sql: `DELETE FROM learning_items WHERE id = ? AND type = 'reading'`,
      args: [id],
    });
    return true;
  } catch (err) {
    console.warn('Failed to delete passage from Turso DB:', err);
    return false;
  }
}

/**
 * 지문 목록 조회 (Turso Cloud DB + 로컬 캐시 지능형 실시간 병합)
 */
export async function getPassagesAction(
  searchQuery = ''
): Promise<ActionResult<PassageListResult>> {
  let all = getStoredPassages();

  try {
    const tursoData = await fetchAllPassagesFromTurso();
    if (tursoData && tursoData.length > 0) {
      const map = new Map<string, PassageItem>();
      for (const t of tursoData) {
        map.set(t.id, t);
      }
      for (const l of all) {
        const existing = map.get(l.id);
        if (!existing) {
          map.set(l.id, l);
          addPassageToTurso(l).catch(() => {});
        } else {
          // 로컬에 번역/문장해석이 있고 Turso에 누락되어 있거나 로컬이 더 최신인 경우 로컬 데이터 우선 보존
          const hasLocalTrans = Boolean(l.sentenceTranslations && l.sentenceTranslations.length > 0);
          const hasTursoTrans = Boolean(existing.sentenceTranslations && existing.sentenceTranslations.length > 0);
          if (hasLocalTrans && !hasTursoTrans) {
            const merged = { ...existing, translation: l.translation || existing.translation, sentenceTranslations: l.sentenceTranslations };
            map.set(l.id, merged);
            addPassageToTurso(merged).catch(() => {});
          } else if (new Date(l.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
            map.set(l.id, l);
            addPassageToTurso(l).catch(() => {});
          }
        }
      }
      all = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveStoredPassages(all);
    } else if (tursoData && tursoData.length === 0 && all.length > 0) {
      for (const item of all) {
        addPassageToTurso(item).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Using local fallback for passages:', err);
  }

  const query = searchQuery.toLowerCase().trim();
  const filtered = all.filter(
    (p) =>
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query) ||
      p.source.toLowerCase().includes(query)
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
 * 새 지문 등록 (단어 및 숙어 전수 자동 추출)
 */
export async function addPassageAction(
  input: CreatePassageInput
): Promise<ActionResult<PassageItem>> {
  const all = getStoredPassages();
  const content = input.content.trim();
  const sentences = splitPassageIntoSentences(content);
  const vocabularyList = extractEnglishWords(content).map((w) => w.word);
  const phraseList = extractEnglishPhrases(content);

  const newItem: PassageItem = {
    id: `passage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title.trim() || '영어 지문 ' + new Date().toLocaleDateString('ko-KR'),
    content,
    translation: input.translation?.trim() || null,
    sentences,
    sentenceTranslations: input.sentenceTranslations,
    vocabularyList,
    phraseList,
    difficulty: input.difficulty ?? 2,
    grade: input.grade ?? 10,
    source: input.source?.trim() || '교재 지문',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  all.unshift(newItem);
  saveStoredPassages(all);

  // Turso Cloud DB 실시간 동기화
  await addPassageToTurso(newItem).catch(() => {});

  return { success: true, data: newItem };
}

/**
 * 지문 수정 (단어 및 숙어 전수 자동 재추출)
 */
export async function updatePassageAction(
  id: string,
  input: UpdatePassageInput
): Promise<ActionResult<PassageItem>> {
  const all = getStoredPassages();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return { success: false, error: '지문을 찾을 수 없습니다.' };

  const current = all[idx];
  const newContent = input.content !== undefined ? input.content.trim() : current.content;
  const sentences = input.content !== undefined ? splitPassageIntoSentences(newContent) : current.sentences;
  const vocabularyList = input.content !== undefined ? extractEnglishWords(newContent).map((w) => w.word) : current.vocabularyList;
  const phraseList = input.content !== undefined ? extractEnglishPhrases(newContent) : current.phraseList;

  const updated: PassageItem = {
    ...current,
    title: input.title !== undefined ? input.title.trim() : current.title,
    content: newContent,
    translation: input.translation !== undefined ? input.translation?.trim() || null : current.translation,
    sentences,
    sentenceTranslations: input.sentenceTranslations !== undefined ? input.sentenceTranslations : current.sentenceTranslations,
    vocabularyList,
    phraseList,
    difficulty: input.difficulty ?? current.difficulty,
    grade: input.grade ?? current.grade,
    source: input.source !== undefined ? input.source.trim() : current.source,
    handwritingNotes: input.handwritingNotes !== undefined ? input.handwritingNotes : current.handwritingNotes,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updated;
  saveStoredPassages(all);

  // Turso Cloud DB 실시간 동기화
  await addPassageToTurso(updated).catch(() => {});

  return { success: true, data: updated };
}

/**
 * 지문 삭제
 */
export async function deletePassageAction(id: string): Promise<ActionResult> {
  const all = getStoredPassages();
  const filtered = all.filter((p) => p.id !== id);
  if (filtered.length === all.length) {
    return { success: false, error: '삭제할 지문을 찾을 수 없습니다.' };
  }
  saveStoredPassages(filtered);

  deletePassageFromTurso(id).catch(() => {});

  return { success: true };
}
