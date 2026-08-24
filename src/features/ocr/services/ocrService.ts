// ===========================
// OCR Processing Service (Enhanced with Full Multi-level Dictionary Resolution)
// ===========================
// 설계서 섹션 11, 28, 61 기반

import { createWorker } from 'tesseract.js';
import { extractEnglishWords, type ExtractedWordCandidate } from '@/lib/ocr/tokenizer';
import { searchWordOnline } from '@/features/vocabulary/services/dictionarySearch';

export interface RecognizeImageOptions {
  imageSource: File | Blob | string;
  onProgress?: (progress: number, status: string) => void;
}

/**
 * 이미지로부터 텍스트를 인식하고 온라인 사전/번역 API로 뜻을 자동 보강하여 반환합니다.
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
        const percent = Math.round((m.progress || 0) * 60) + 15;
        onProgress?.(percent, `글자 인식 중... (${Math.round((m.progress || 0) * 100)}%)`);
      }
    },
  });

  onProgress?.(25, '이미지 분석 시작...');
  const ret = await worker.recognize(imageSource);
  const rawText = ret.data.text || '';

  onProgress?.(75, '영어 단어 및 기본 사전 매핑 중...');
  await worker.terminate();

  // 1. 기본 토크나이징 및 내장 사전 매핑 (원형 분석 포함)
  const candidates = extractEnglishWords(rawText);

  // 2. 뜻이 없는 단어들은 온라인 사전으로 모든 단어 일괄 자동 보충 (제한 없이 전체 처리)
  const wordsToLookup = candidates.filter(
    (c) => !c.meaning || c.meaning.trim() === '' || c.meaning === '의미 미입력' || c.meaning === '의미 검색 필요'
  );

  if (wordsToLookup.length > 0) {
    const totalToLookup = wordsToLookup.length;
    let completed = 0;
    const BATCH_SIZE = 8;

    for (let i = 0; i < wordsToLookup.length; i += BATCH_SIZE) {
      const batch = wordsToLookup.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item) => {
          try {
            const searchResult = await searchWordOnline(item.word);
            if (searchResult && searchResult.meaning && searchResult.meaning !== '의미 검색 필요') {
              item.meaning = searchResult.meaning;
              if (searchResult.partOfSpeech) item.partOfSpeech = searchResult.partOfSpeech;
              if (searchResult.pronunciation) item.pronunciation = searchResult.pronunciation;
            }
          } catch {
            // ignore online lookup failure
          } finally {
            completed++;
            const pct = 75 + Math.round((completed / totalToLookup) * 23);
            onProgress?.(pct, `사전에서 단어 뜻 자동 완성 중... (${completed}/${totalToLookup}개)`);
          }
        })
      );
    }
  }

  onProgress?.(100, '완료!');
  return {
    rawText,
    candidates,
  };
}
