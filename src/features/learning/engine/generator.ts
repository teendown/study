// ===========================
// Question Generator Engine
// ===========================
// 설계서 섹션 9, 36 기반
// 단어 목록으로부터 문제 자동 생성

import type { VocabularyWithItem } from '@/features/vocabulary/types';
import type { GeneratedQuestion } from '../types';
import type { StudyMode, QuestionType } from '@/types';

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
 * 예: "abandon" -> "a _ a n d _ n"
 */
function createMaskedWord(word: string): { masked: string; missing: string } {
  if (word.length <= 3) {
    return { masked: word[0] + ' _ ' + word.slice(2), missing: word[1] };
  }

  const chars = word.split('');
  // 1~2개 글자를 빈칸으로 처리
  const maskIndices = new Set<number>();
  const numToMask = Math.min(Math.floor(word.length / 3) + 1, 3);

  while (maskIndices.size < numToMask) {
    const randIdx = 1 + Math.floor(Math.random() * (word.length - 2));
    maskIndices.add(randIdx);
  }

  const masked = chars
    .map((c, i) => (maskIndices.has(i) ? '_' : c))
    .join(' ');

  return { masked, missing: word };
}

/**
 * 단어 목록으로부터 학습 문제 세트를 생성합니다.
 */
export function generateQuestions(
  vocabList: VocabularyWithItem[],
  mode: StudyMode = 'learning',
  count: number = 10
): GeneratedQuestion[] {
  if (!vocabList || vocabList.length === 0) return [];

  const shuffledVocab = shuffleArray(vocabList);
  const selectedVocab = shuffledVocab.slice(0, count);
  const questions: GeneratedQuestion[] = [];

  const questionTypes: QuestionType[] =
    mode === 'speed'
      ? ['multiple_choice', 'translation']
      : ['multiple_choice', 'fill_blank', 'translation', 'typing'];

  selectedVocab.forEach((vocab, idx) => {
    // 문제 유형 선택
    const qType = questionTypes[idx % questionTypes.length];

    if (qType === 'multiple_choice') {
      // 1. 객관식: 영단어 보고 올바른 한국어 뜻 고르기
      const isEnglishToKorean = Math.random() > 0.4;

      if (isEnglishToKorean) {
        // 보기 생성 (정답 1개 + 오답 3개)
        const wrongMeanings = vocabList
          .filter((v) => v.id !== vocab.id)
          .map((v) => v.meaning);

        const shuffledWrong = shuffleArray(wrongMeanings).slice(0, 3);
        // 혹시 단어가 4개 미만인 경우 기본 더미 오답 보충
        while (shuffledWrong.length < 3) {
          shuffledWrong.push(`기타 다른 의미 ${shuffledWrong.length + 1}`);
        }

        const options = shuffleArray([vocab.meaning, ...shuffledWrong]);

        questions.push({
          id: `q-${idx}-${Date.now()}`,
          learningItemId: vocab.learningItemId,
          type: 'multiple_choice',
          questionText: `다음 단어의 올바른 뜻은 무엇일까요?`,
          correctAnswer: vocab.meaning,
          options,
          hint: vocab.partOfSpeech ? `품사: ${vocab.partOfSpeech}` : undefined,
          explanation: vocab.exampleSentence
            ? `예문: ${vocab.exampleSentence} (${vocab.exampleTranslation || ''})`
            : undefined,
          word: vocab,
          timeLimit: mode === 'speed' ? 7 : undefined,
        });
      } else {
        // 뜻 보고 영단어 고르기
        const wrongWords = vocabList
          .filter((v) => v.id !== vocab.id)
          .map((v) => v.word);

        const shuffledWrong = shuffleArray(wrongWords).slice(0, 3);
        while (shuffledWrong.length < 3) {
          shuffledWrong.push(`option_${shuffledWrong.length + 1}`);
        }

        const options = shuffleArray([vocab.word, ...shuffledWrong]);

        questions.push({
          id: `q-${idx}-${Date.now()}`,
          learningItemId: vocab.learningItemId,
          type: 'multiple_choice',
          questionText: `"${vocab.meaning}"에 해당하는 영단어는?`,
          correctAnswer: vocab.word,
          options,
          hint: vocab.pronunciation || undefined,
          explanation: `정답: ${vocab.word} (${vocab.meaning})`,
          word: vocab,
          timeLimit: mode === 'speed' ? 7 : undefined,
        });
      }
    } else if (qType === 'fill_blank') {
      // 2. 빈칸 채우기
      const { masked } = createMaskedWord(vocab.word);

      questions.push({
        id: `q-${idx}-${Date.now()}`,
        learningItemId: vocab.learningItemId,
        type: 'fill_blank',
        questionText: `빈칸에 알맞은 단어의 완전한 철자를 입력하세요.`,
        correctAnswer: vocab.word.toLowerCase(),
        hint: `힌트: ${masked} (${vocab.meaning})`,
        explanation: `${vocab.word} - ${vocab.meaning}`,
        word: vocab,
        timeLimit: mode === 'speed' ? 10 : undefined,
      });
    } else if (qType === 'typing' || qType === 'translation') {
      // 3. 한글 뜻을 보고 영단어 직접 입력
      questions.push({
        id: `q-${idx}-${Date.now()}`,
        learningItemId: vocab.learningItemId,
        type: 'typing',
        questionText: `"${vocab.meaning}"의 영단어를 입력하세요.`,
        correctAnswer: vocab.word.toLowerCase(),
        hint: vocab.partOfSpeech
          ? `품사: ${vocab.partOfSpeech}, 첫 글자: ${vocab.word[0].toUpperCase()}`
          : `첫 글자: ${vocab.word[0].toUpperCase()}`,
        explanation: `${vocab.word} : ${vocab.meaning}`,
        word: vocab,
        timeLimit: mode === 'speed' ? 10 : undefined,
      });
    }
  });

  return questions;
}
