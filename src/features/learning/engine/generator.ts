// ===========================
// Question Generator Engine (Enhanced)
// ===========================
// 설계서 섹션 9.1~9.8 기반 (객관식, 빈칸, 타이핑, 숙어, 문장완성)

import type { VocabularyWithItem } from '@/features/vocabulary/types';
import type { PhraseWithItem } from '@/features/vocabulary/types/phraseTypes';
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
 * 숙어에서 특정 단어(전치사/부사)를 빈칸으로 만듭니다. (설계서 섹션 9.8)
 * 예: "look forward to" -> "look forward ______" (정답: to)
 */
export function createPhraseBlankQuestion(phrase: string): { maskedPhrase: string; targetWord: string } {
  const words = phrase.split(' ');
  if (words.length <= 1) {
    return { maskedPhrase: `${phrase} ______`, targetWord: phrase };
  }

  // 마지막 단어(주로 전치사) 또는 중간 단어 마스킹
  const targetIdx = words.length - 1;
  const targetWord = words[targetIdx];
  const maskedPhrase = words
    .map((w, i) => (i === targetIdx ? '______' : w))
    .join(' ');

  return { maskedPhrase, targetWord };
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

  const shuffledVocab = shuffleArray(vocabList);
  const selectedVocab = shuffledVocab.slice(0, count);
  const questions: GeneratedQuestion[] = [];

  const questionTypes: QuestionType[] =
    mode === 'speed'
      ? ['multiple_choice', 'translation']
      : ['multiple_choice', 'fill_blank', 'translation', 'typing', 'sentence_completion'];

  selectedVocab.forEach((vocab, idx) => {
    const qType = questionTypes[idx % questionTypes.length];

    // 1. 문장 완성형 문제 (예문이 있는 경우, 설계서 섹션 9.5)
    if (qType === 'sentence_completion' && vocab.exampleSentence && vocab.exampleSentence.includes(vocab.word)) {
      const sentenceMasked = vocab.exampleSentence.replace(
        new RegExp(vocab.word, 'gi'),
        '______'
      );

      const wrongWords = vocabList.filter((v) => v.id !== vocab.id).map((v) => v.word);
      const shuffledWrong = shuffleArray(wrongWords).slice(0, 3);
      while (shuffledWrong.length < 3) {
        shuffledWrong.push(`option_${shuffledWrong.length + 1}`);
      }

      const options = shuffleArray([vocab.word, ...shuffledWrong]);

      questions.push({
        id: `q-${idx}-${Date.now()}`,
        learningItemId: vocab.learningItemId,
        type: 'sentence_completion',
        questionText: `문장의 빈칸에 들어갈 가장 알맞은 어휘를 고르세요.\n"${sentenceMasked}"`,
        correctAnswer: vocab.word,
        options,
        hint: vocab.exampleTranslation ? `해석: ${vocab.exampleTranslation}` : undefined,
        explanation: `${vocab.word} (${vocab.meaning}) - ${vocab.exampleSentence}`,
        word: vocab,
        timeLimit: mode === 'speed' ? 10 : undefined,
      });
      return;
    }

    // 2. 객관식 4지선다 (설계서 섹션 9.1)
    if (qType === 'multiple_choice') {
      const isEnglishToKorean = Math.random() > 0.4;

      if (isEnglishToKorean) {
        const wrongMeanings = vocabList.filter((v) => v.id !== vocab.id).map((v) => v.meaning);
        const shuffledWrong = shuffleArray(wrongMeanings).slice(0, 3);
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
        const wrongWords = vocabList.filter((v) => v.id !== vocab.id).map((v) => v.word);
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
      return;
    }

    // 3. 빈칸 채우기 (설계서 섹션 9.2)
    if (qType === 'fill_blank') {
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
      return;
    }

    // 4. 타이핑 / 한글->영어 직접 입력 (설계서 섹션 9.3)
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
  });

  return questions;
}
