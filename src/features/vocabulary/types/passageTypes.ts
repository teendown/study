// ===========================
// Reading Passage Types (영어 본문/독해 지문 타입)
// ===========================

export interface PassageItem {
  id: string;
  title: string;
  content: string;
  translation?: string | null;
  sentences: string[];
  vocabularyList?: string[];
  difficulty: number;
  grade?: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePassageInput {
  title: string;
  content: string;
  translation?: string;
  source?: string;
  difficulty?: number;
  grade?: number;
}

export interface UpdatePassageInput {
  title?: string;
  content?: string;
  translation?: string;
  source?: string;
  difficulty?: number;
  grade?: number;
}

export interface PassageListResult {
  items: PassageItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
