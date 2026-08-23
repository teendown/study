// ===========================
// OCR Processing Service
// ===========================
// 설계서 섹션 11, 28, 61 기반

import { createWorker } from 'tesseract.js';
import { extractEnglishWords, type ExtractedWordCandidate } from '@/lib/ocr/tokenizer';

export interface RecognizeImageOptions {
  imageSource: File | Blob | string;
  onProgress?: (progress: number, status: string) => void;
}

/**
 * 이미지로부터 텍스트를 인식하고 영어 단어 후보 목록을 추출합니다.
 */
export async function recognizeAndExtractWords({
  imageSource,
  onProgress,
}: RecognizeImageOptions): Promise<{
  rawText: string;
  candidates: ExtractedWordCandidate[];
}> {
  onProgress?.(10, 'OCR 엔진 준비 중...');

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const percent = Math.round((m.progress || 0) * 80) + 15;
        onProgress?.(percent, `글자 인식 중... (${Math.round((m.progress || 0) * 100)}%)`);
      }
    },
  });

  onProgress?.(25, '이미지 분석 시작...');
  const ret = await worker.recognize(imageSource);
  const rawText = ret.data.text || '';

  onProgress?.(95, '영어 단어 및 뜻 분석 중...');
  await worker.terminate();

  // 토크나이저를 통해 단어 후보 추출 및 사전 매핑
  const candidates = extractEnglishWords(rawText);

  onProgress?.(100, '완료!');
  return {
    rawText,
    candidates,
  };
}
