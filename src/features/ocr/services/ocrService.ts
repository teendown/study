// ===========================
// OCR Processing Service (Enhanced with Online Translation)
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
        const percent = Math.round((m.progress || 0) * 70) + 15;
        onProgress?.(percent, `글자 인식 중... (${Math.round((m.progress || 0) * 100)}%)`);
      }
    },
  });

  onProgress?.(25, '이미지 분석 시작...');
  const ret = await worker.recognize(imageSource);
  const rawText = ret.data.text || '';

  onProgress?.(85, '영어 단어 추출 중...');
  await worker.terminate();

  // 1. 기본 토크나이징
  const candidates = extractEnglishWords(rawText);

  // 2. 뜻이 없는 단어들은 온라인 사전/번역으로 실시간 자동 보충
  const wordsToLookup = candidates.filter((c) => !c.meaning || c.meaning === '의미 미입력').slice(0, 10);

  if (wordsToLookup.length > 0) {
    onProgress?.(90, `온라인 사전에서 뜻 검색 중... (${wordsToLookup.length}개)`);

    await Promise.all(
      wordsToLookup.map(async (item) => {
        try {
          const searchResult = await searchWordOnline(item.word);
          if (searchResult.meaning && searchResult.meaning !== '의미 검색 필요') {
            item.meaning = searchResult.meaning;
            if (searchResult.partOfSpeech) item.partOfSpeech = searchResult.partOfSpeech;
          }
        } catch {
          // ignore online lookup failure
        }
      })
    );
  }

  onProgress?.(100, '완료!');
  return {
    rawText,
    candidates,
  };
}
