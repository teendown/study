import { createWorker } from 'tesseract.js';
import { extractEnglishWords, type ExtractedWordCandidate } from '@/lib/ocr/tokenizer';
import { extractEnglishPhrases, type ExtractedPhraseResult } from '@/lib/ocr/phraseDictionary';
import { searchWordOnline, sanitizeMeaningText } from '@/features/vocabulary/services/dictionarySearch';
import { preprocessImageForOcr } from '@/lib/ocr/imagePreprocessor';
import { reconstructPassageText, splitPassageIntoSentences } from '@/lib/ocr/textCleaner';
import { extractFromImageWithGemini, getGeminiApiKey } from '@/lib/ai/geminiService';
import { convertToKoreanPronunciation } from '@/features/vocabulary/services/koreanPronunciation';

export interface RecognizeImageOptions {
  imageSource: File | Blob | string;
  onProgress?: (progress: number, status: string) => void;
}

export interface OcrRecognitionResult {
  rawText: string;
  passageText: string; // 완성형 본문 문맥 텍스트
  sentences: string[]; // 문장별 분리 목록
  candidates: ExtractedWordCandidate[];
  phraseCandidates: ExtractedPhraseResult[]; // 추출된 숙어/연어 목록
}

/**
 * 이미지 전처리 + Google Gemini AI Vision (1순위) + Tesseract OCR (2순위 Fallback) 단어/숙어/표/지문 통합 추출 파이프라인
 */
export async function recognizeAndExtractWords({
  imageSource,
  onProgress,
}: RecognizeImageOptions): Promise<OcrRecognitionResult> {
  // 🌟 [1순위] Google Gemini AI Vision 지능형 표(Table) & 지문 다차원 분석
  if (getGeminiApiKey()) {
    onProgress?.(20, 'Google Gemini AI 비전 엔진 준비 중...');
    try {
      onProgress?.(40, 'AI가 이미지 속 단어장 표와 지문을 정밀 검수하는 중...');
      const geminiVisionResult = await extractFromImageWithGemini(imageSource);
      if (geminiVisionResult && (geminiVisionResult.words.length > 0 || geminiVisionResult.phrases.length > 0 || geminiVisionResult.passageText)) {
        onProgress?.(85, '추출된 단어 및 숙어 학습 데이터 구성 중...');

        const candidates: ExtractedWordCandidate[] = geminiVisionResult.words.map((w, idx) => ({
          id: `ocr-ai-w-${idx}-${Date.now()}`,
          word: w.text.trim(),
          meaning: sanitizeMeaningText(w.meaning, w.text) || w.meaning,
          partOfSpeech: w.partOfSpeech || 'n.',
          pronunciation: w.pronunciation || convertToKoreanPronunciation('', w.text),
          difficulty: w.difficulty || 2,
          selected: true,
          sourceText: w.text.trim(),
        }));

        const phraseCandidates: ExtractedPhraseResult[] = geminiVisionResult.phrases.map((p, idx) => ({
          id: `ocr-ai-p-${idx}-${Date.now()}`,
          phrase: p.text.trim(),
          meaning: sanitizeMeaningText(p.meaning, p.text) || p.meaning,
          matchedText: p.text.trim(),
          startIndex: 0,
          endIndex: p.text.trim().length,
          difficulty: p.difficulty || 2,
          pattern: 'idiom',
          selected: true,
        }));

        onProgress?.(100, 'AI 분석 및 단어장 추출 완료!');
        return {
          rawText: geminiVisionResult.rawText || geminiVisionResult.passageText,
          passageText: geminiVisionResult.passageText,
          sentences: geminiVisionResult.sentences,
          candidates,
          phraseCandidates,
        };
      }
    } catch (err) {
      console.warn('Gemini Vision recognition fallback to Tesseract:', err);
    }
  }

  // 1단계: 캔버스 기반 이미지 전처리 (노이즈 제거, 흑백 대비 극대화, 선명화)
  onProgress?.(15, '이미지 화질 개선 및 선명화 처리 중...');
  let processedImage: string;
  try {
    processedImage = await preprocessImageForOcr(imageSource);
  } catch (e) {
    console.warn('Preprocessing failed, using raw source:', e);
    processedImage = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
  }

  // 2단계: Tesseract OCR 엔진 초기화
  onProgress?.(25, '고정밀 OCR 엔진 준비 중...');
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const percent = Math.round((m.progress || 0) * 45) + 30;
        onProgress?.(percent, `글자 고정밀 인식 중... (${Math.round((m.progress || 0) * 100)}%)`);
      }
    },
  });

  // Tesseract 파라미터 최적화 (영어 교재/지문 블록 인식 최적화)
  await worker.setParameters({
    tessedit_pageseg_mode: '3' as unknown as import('tesseract.js').PSM,
    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?;:\'"-()/%$#@ ',
  });

  // 3단계: 텍스트 인식 실행
  onProgress?.(35, '본문 및 텍스트 블록 분석 중...');
  const ret = await worker.recognize(processedImage);
  const rawText = ret.data.text || '';
  await worker.terminate();

  // 4단계: 사후 텍스트 정제 및 본문 문맥 복원
  onProgress?.(70, '문맥 복원 및 오탈자 교정 중...');
  const passageText = reconstructPassageText(rawText);
  const sentences = splitPassageIntoSentences(passageText);

  // 5단계: 숙어/연어 정밀 추출 (원문 및 복원문 전체 대상)
  onProgress?.(75, '지문 내 필수 숙어 및 연어 자동 판독 중...');
  const phraseCandidates = extractEnglishPhrases(passageText || rawText);

  // 6단계: 단어 추출 및 사전 매핑
  onProgress?.(80, '핵심 영어 어휘 추출 및 사전 매핑 중...');
  const candidates = extractEnglishWords(passageText || rawText);

  // 7단계: 뜻 누락 단어 온라인 사전 일괄 자동 보충
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
            // ignore
          } finally {
            completed++;
            const pct = 80 + Math.round((completed / totalToLookup) * 18);
            onProgress?.(pct, `사전에서 단어 뜻 자동 완성 중... (${completed}/${totalToLookup}개)`);
          }
        })
      );
    }
  }

  // 최종 후보군 뜻/스포일러 정제
  const sanitizedCandidates = candidates.map((c) => ({
    ...c,
    meaning: sanitizeMeaningText(c.meaning, c.word),
  }));

  const sanitizedPhrases = phraseCandidates.map((p) => ({
    ...p,
    meaning: sanitizeMeaningText(p.meaning, p.phrase),
  }));

  onProgress?.(100, '완료!');
  return {
    rawText,
    passageText,
    sentences,
    candidates: sanitizedCandidates,
    phraseCandidates: sanitizedPhrases,
  };
}
