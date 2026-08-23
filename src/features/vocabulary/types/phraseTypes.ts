// ===========================
// Phrase Types
// ===========================

export interface PhraseWithItem {
  id: string;
  phrase: string;
  meaning: string;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  difficulty: number;
  grade: number | null;
  source: string | null;
  learningItemId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhraseListResult {
  items: PhraseWithItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
