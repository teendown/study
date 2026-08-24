// ===========================
// Question Generator Engine (Enhanced & Anti-Spoiler Filtered)
// ===========================
// 설계서 섹션 9.1~9.8 기반 (객관식, 빈칸, 타이핑, 숙어, 문장완성)

import type { VocabularyWithItem } from '@/features/vocabulary/types';
import type { GeneratedQuestion } from '../types';
import type { StudyMode, QuestionType } from '@/types';
import { sanitizeMeaningText } from '@/features/vocabulary/services/dictionarySearch';

const FALLBACK_ENGLISH_DISTRACTORS = [
  'maintain', 'consider', 'encourage', 'achieve', 'improve',
  'provide', 'require', 'determine', 'develop', 'discover',
  'protect', 'participate', 'recommend', 'continue', 'express',
  'include', 'understand', 'remember', 'describe', 'support'
];

const FALLBACK_KOREAN_DISTRACTORS = [
  '유지하다, 보존하다', '고려하다, 생각하다', '격려하다, 장려하다',
  '달성하다, 성취하다', '향상시키다, 개선하다', '제공하다, 공급하다',
  '요구하다, 필요로 하다', '결정하다, 확정하다', '개발하다, 발전시키다',
  '포기하다, 버리다', '기억하다, 생각나다', '설명하다, 묘사하다'
];

// 배열 무작위 셔플
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 단어 철자에 빈칸 마스킹을 적용합니다.
 */
export function createMaskedWord(word: string): { masked: string; missing: string } {
  if (!word) return { masked: '', missing: '' };
  if (word.length <= 3) {
    return { masked: word[0] + ' _ ' + word.slice(2), missing: word[1] || word };
  }

  // 여러 단어로 이루어진 숙어인 경우 각 단어별 마스킹
  if (word.includes(' ')) {
    const subWords = word.split(' ');
    const maskedParts = subWords.map((sw) => {
      if (sw.length <= 2) return sw;
      return sw[0] + ' ' + '_ '.repeat(Math.max(1, sw.length - 2)).trim() + ' ' + sw[sw.length - 1];
    });
    return { masked: maskedParts.join('   '), missing: word };
  }

  const chars = word.split('');
  const maskIndices = new Set<number>();
  const numToMask = Math.min(Math.floor(word.length / 3) + 1, 3);

  while (maskIndices.size < numToMask) {
    const randIdx = 1 + Math.floor(Math.random() * (word.length - 2));
    maskIndices.add(randIdx);
  }

  const masked = chars.map((c, i) => (maskIndices.has(i) ? '_' : c)).join(' ');
  return { masked, missing: word };
}

/**
 * 단어 및 숙어 목록으로부터 종합 학습 문제 세트를 생성합니다.
 */
export function generateQuestions(
  vocabList: VocabularyWithItem[],
  mode: StudyMode = 'learning',
  count: number = 10
): GeneratedQuestion[] {
  if (!vocabList || vocabList.length === 0) return [];

  // 각 단어 데이터의 뜻(meaning)을 선제적으로 스포일러/오탈자 정제
  const sanitizedVocabList: VocabularyWithItem[] = vocabList.map((v) => ({
    ...v,
    meaning: sanitizeMeaningText(v.meaning, v.word) || v.meaning,
  }));

  const shuffledVocab = shuffleArray(sanitizedVocabList);
  const selectedVocab = shuffledVocab.slice(0, count);
  const questions: GeneratedQuestion[] = [];

  const questionTypes: QuestionType[] =
    mode === 'speed'
      ? ['multiple_choice', 'sentence_completion']
      : ['multiple_choice', 'sentence_completion', 'fill_blank', 'typing'];

  selectedVocab.forEach((vocab, idx) => {
    const qType = questionTypes[idx % questionTypes.length];
    const cleanMeaning = sanitizeMeaningText(vocab.meaning, vocab.word) || vocab.meaning;

    // 1. 문장 완성형 문제 (예문이 있고 단어가 포함된 경우)
    if (
      (qType === 'sentence_completion' || (mode === 'speed' && idx % 2 === 1)) &&
      vocab.exampleSentence &&
      vocab.exampleSentence.toLowerCase().includes(vocab.word.toLowerCase())
    ) {
      // 본문 속 단어 마스킹
      const regex = new RegExp(`\\b${vocab.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[a-z]*\\b`, 'gi');
      const sentenceMasked = vocab.exampleSentence.replace(regex, '______');

      // 오답 선택지 3개 추출
      const otherWords = sanitizedVocabList
        .filter((v) => v.id !== vocab.id && v.word.toLowerCase() !== vocab.word.toLowerCase())
        .map((v) => v.word);

      const wrongWords = shuffleArray(Array.from(new Set(otherWords))).slice(0, 3);
      for (const fallback of FALLBACK_ENGLISH_DISTRACTORS) {
        if (wrongWords.length >= 3) break;
        if (fallback.toLowerCase() !== vocab.word.toLowerCase() && !wrongWords.includes(fallback)) {
          wrongWords.push(fallback);
        }
      }

      const options = shuffleArray([vocab.word, ...wrongWords.slice(0, 3)]);

      questions.push({
        id: `q-${idx}-${Date.now()}`,
        learningItemId: vocab.learningItemId,
        type: 'sentence_completion',
        questionText: `문장의 빈칸에 들어갈 가장 알맞은 어휘를 고르세요.`,
        correctAnswer: vocab.word,
        options,
        hint: vocab.exampleTranslation ? `해석: ${vocab.exampleTranslation}` : `뜻: ${cleanMeaning}`,
        explanation: `${vocab.word} (${cleanMeaning}) : ${vocab.exampleSentence}`,
        word: {
          ...vocab,
          meaning: cleanMeaning,
          exampleSentence: sentenceMasked,
        },
        timeLimit: mode === 'speed' ? 10 : undefined,
      });
      return;
    }

    // 2. 객관식 4지선다 (단어 -> 뜻 또는 뜻 -> 단어)
    if (qType === 'multiple_choice' || mode === 'speed') {
      const isEnglishToKorean = Math.random() > 0.4;

      if (isEnglishToKorean) {
        const otherMeanings = sanitizedVocabList
          .filter((v) => v.id !== vocab.id && v.meaning !== cleanMeaning)
          .map((v) => sanitizeMeaningText(v.meaning, v.word))
          .filter(Boolean);

        const wrongMeanings = shuffleArray(Array.from(new Set(otherMeanings))).slice(0, 3);
        for (const fallback of FALLBACK_KOREAN_DISTRACTORS) {
          if (wrongMeanings.length >= 3) break;
          const cleanFb = sanitizeMeaningText(fallback);
          if (cleanFb !== cleanMeaning && !wrongMeanings.includes(cleanFb)) {
            wrongMeanings.push(cleanFb);
          }
        }

        const options = shuffleArray([cleanMeaning, ...wrongMeanings.slice(0, 3)]);

        questions.push({
          id: `q-${idx}-${Date.now()}`,
          learningItemId: vocab.learningItemId,
          type: 'multiple_choice',
          questionText: `다음 단어의 올바른 뜻은 무엇일까요?`,
          correctAnswer: cleanMeaning,
          options,
          hint: vocab.partOfSpeech ? `품사: ${vocab.partOfSpeech}` : undefined,
          explanation: vocab.exampleSentence
            ? `${vocab.word} : ${cleanMeaning} (${vocab.exampleSentence})`
            : `${vocab.word} : ${cleanMeaning}`,
          word: {
            ...vocab,
            meaning: cleanMeaning,
          },
          timeLimit: mode === 'speed' ? 7 : undefined,
        });
      } else {
        const otherWords = sanitizedVocabList
          .filter((v) => v.id !== vocab.id && v.word.toLowerCase() !== vocab.word.toLowerCase())
          .map((v) => v.word);

        const wrongWords = shuffleArray(Array.from(new Set(otherWords))).slice(0, 3);
        for (const fallback of FALLBACK_ENGLISH_DISTRACTORS) {
          if (wrongWords.length >= 3) break;
          if (fallback.toLowerCase() !== vocab.word.toLowerCase() && !wrongWords.includes(fallback)) {
            wrongWords.push(fallback);
          }
        }

        const options = shuffleArray([vocab.word, ...wrongWords.slice(0, 3)]);

        questions.push({
          id: `q-${idx}-${Date.now()}`,
          learningItemId: vocab.learningItemId,
          type: 'multiple_choice',
          questionText: `"${cleanMeaning}"에 해당하는 영단어를 고르세요.`,
          correctAnswer: vocab.word,
          options,
          hint: vocab.pronunciation || undefined,
          explanation: `정답: ${vocab.word} (${cleanMeaning})`,
          word: {
            ...vocab,
            meaning: cleanMeaning,
          },
          timeLimit: mode === 'speed' ? 7 : undefined,
        });
      }
      return;
    }

    // 3. 빈칸 채우기 (한국어 뜻 + 철자 마스킹 / 예문 빈칸)
    if (qType === 'fill_blank') {
      const { masked } = createMaskedWord(vocab.word);

      questions.push({
        id: `q-${idx}-${Date.now()}`,
        learningItemId: vocab.learningItemId,
        type: 'fill_blank',
        questionText: `빈칸에 알맞은 단어의 완전한 철자를 입력하세요.`,
        correctAnswer: vocab.word.toLowerCase(),
        hint: `철자 힌트: ${masked}`,
        explanation: `${vocab.word} - ${cleanMeaning}`,
        word: {
          ...vocab,
          meaning: cleanMeaning,
        },
        timeLimit: undefined,
      });
      return;
    }

    // 4. 타이핑 / 한글->영어 직접 입력
    questions.push({
      id: `q-${idx}-${Date.now()}`,
      learningItemId: vocab.learningItemId,
      type: 'typing',
      questionText: `다음 의미에 알맞은 영단어를 입력하세요.`,
      correctAnswer: vocab.word.toLowerCase(),
      hint: vocab.partOfSpeech
        ? `품사: ${vocab.partOfSpeech}, 첫 글자: ${vocab.word[0].toUpperCase()}`
        : `첫 글자: ${vocab.word[0].toUpperCase()}`,
      explanation: `${vocab.word} : ${cleanMeaning}`,
      word: {
        ...vocab,
        meaning: cleanMeaning,
      },
      timeLimit: undefined,
    });
  });

  return questions;
}
