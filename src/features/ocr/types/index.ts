// ===========================
// OCR Feature Types
// ===========================

import type { ExtractedWordCandidate } from '@/lib/ocr/tokenizer';

export type OcrStep = 'upload' | 'processing' | 'review';

export interface OcrProcessingState {
  step: OcrStep;
  progress: number; // 0~100
  statusText: string;
  rawText: string;
  candidates: ExtractedWordCandidate[];
  error: string | null;
}
