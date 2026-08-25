// ===========================
// Vocabulary Types
// ===========================

export interface VocabularyWithItem {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string | null;
  pronunciation: string | null;
  audioUrl: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  synonyms: string | null;
  antonyms: string | null;
  frequency: string | null;
  difficulty: number;
  grade: number | null;
  source: string | null;
  confidence?: number | null;
  verified?: boolean | null;
  learningItemId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyListResult {
  items: VocabularyWithItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export * from './phraseTypes';
export * from './passageTypes';
