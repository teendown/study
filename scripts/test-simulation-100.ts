// ==========================================
// 100x Learning Session Simulation & Validation Suite
// ==========================================
import { generateQuestions, createMaskedWord } from '../src/features/learning/engine/generator';
import { sanitizeMeaningText } from '../src/features/vocabulary/services/dictionarySearch';
import { lookupWordMeaning, BUILTIN_DICTIONARY } from '../src/lib/ocr/dictionary';
import type { VocabularyWithItem } from '../src/features/vocabulary/types';

// Diverse mock vocabulary database for simulation
const MOCK_VOCAB_DATA: Array<{ word: string; meaning: string; pos?: string; ex?: string; exTrans?: string }> = [
  // Words with edge case meanings (containing examples, punctuation glitches, inflections)
  { word: 'better', meaning: '더 좋다., I hope you feel better. 빨리 쾌차하세요.', pos: 'adj.', ex: 'I feel much better today.', exTrans: '나는 오늘 훨씬 기분이 좋다.' },
  { word: 'getting', meaning: 'get의 현재분사., get의 동명사.', pos: 'v.', ex: 'I am getting ready for school.', exTrans: '나는 학교 갈 준비를 하고 있다.' },
  { word: 'right', meaning: '올바른, 정확한, 맞는., That is not right. 그것은 옳지 않다.', pos: 'adj.', ex: 'That is the right answer.', exTrans: '그것이 올바른 정답이다.' },
  { word: 'running', meaning: '달리기, 운영하는 (run의 현재분사)', pos: 'n.', ex: 'Running is good for health.', exTrans: '달리기는 건강에 좋다.' },
  { word: 'abandon', meaning: '포기하다, 버리다', pos: 'v.', ex: 'Never abandon your dreams.', exTrans: '결코 당신의 꿈을 포기하지 마라.' },
  { word: 'accomplish', meaning: '성취하다, 완수하다', pos: 'v.', ex: 'You can accomplish anything with hard work.', exTrans: '노력하면 무엇이든 성취할 수 있다.' },
  { word: 'biodiversity', meaning: '생물 다양성', pos: 'n.', ex: 'Rainforests are rich in biodiversity.', exTrans: '열대우림은 생물 다양성이 풍부하다.' },
  { word: 'take care of', meaning: '~을 돌보다, 처리하다', pos: 'phr.', ex: 'Please take care of the baby.', exTrans: '아기를 잘 돌봐주세요.' },
  { word: 'look forward to', meaning: '~을 고대하다, 기대하다', pos: 'phr.', ex: 'I look forward to meeting you.', exTrans: '너를 만나기를 고대한다.' },
  { word: 'run out of', meaning: '~이 바닥나다, 다 떨어지다', pos: 'phr.', ex: 'We ran out of gas.', exTrans: '우리는 기름이 다 떨어졌다.' },
  { word: 'give up', meaning: '포기하다, 그만두다', pos: 'phr.', ex: 'Do not give up hope.', exTrans: '희망을 포기하지 마라.' },
  { word: 'sustainable', meaning: '지속 가능한', pos: 'adj.', ex: 'We need sustainable energy sources.', exTrans: '우리는 지속 가능한 에너지원이 필요하다.' },
  { word: 'make', meaning: '만들다, 이루다', pos: 'v.', ex: 'Make a good choice.', exTrans: '좋은 선택을 해라.' },
  { word: 'benefit', meaning: '이익, 혜택, 유익하다', pos: 'n.', ex: 'Exercise brings many benefits.', exTrans: '운동은 많은 이점을 가져다준다.' },
  { word: 'concentrate', meaning: '집중하다, 전념하다', pos: 'v.', ex: 'I cannot concentrate on my work.', exTrans: '일에 집중할 수가 없다.' },
  { word: 'encourage', meaning: '격려하다, 용기를 주다', pos: 'v.', ex: 'Teachers encourage students to read.', exTrans: '교사들은 학생들이 독서하도록 격려한다.' },
  { word: 'environment', meaning: '환경, 자연환경', pos: 'n.', ex: 'We must protect the environment.', exTrans: '우리는 환경을 보호해야 한다.' },
  { word: 'generate', meaning: '생성하다, 발생시키다', pos: 'v.', ex: 'Solar panels generate electricity.', exTrans: '태양광 패널은 전기를 생성한다.' },
  { word: 'habit', meaning: '습관, 버릇', pos: 'n.', ex: 'Good habits are hard to form.', exTrans: '좋은 습관은 형성하기 어렵다.' },
  { word: 'identify', meaning: '확인하다, 식별하다', pos: 'v.', ex: 'Can you identify the problem?', exTrans: '문제를 확인할 수 있나요?' },
  { word: 'knowledge', meaning: '지식, 앎', pos: 'n.', ex: 'Knowledge is power.', exTrans: '아는 것이 힘이다.' },
  { word: 'logical', meaning: '논리적인, 타당한', pos: 'adj.', ex: 'She gave a logical explanation.', exTrans: '그녀는 논리적인 설명을 제시했다.' },
  { word: 'manage', meaning: '관리하다, 해내다', pos: 'v.', ex: 'He managed to pass the test.', exTrans: '그는 시험을 간신히 통과했다.' },
  { word: 'necessary', meaning: '필요한, 필수적인', pos: 'adj.', ex: 'Sleep is necessary for health.', exTrans: '수면은 건강에 필수적이다.' },
  { word: 'opportunity', meaning: '기회, 호기', pos: 'n.', ex: 'Seize the opportunity.', exTrans: '기회를 잡아라.' },
  { word: 'participate', meaning: '참여하다, 참가하다', pos: 'v.', ex: 'Join and participate actively.', exTrans: '참가하여 적극적으로 참여하세요.' },
  { word: 'quality', meaning: '품질, 우수함, 질', pos: 'n.', ex: 'Focus on quality over quantity.', exTrans: '양보다 질에 집중하라.' },
  { word: 'remember', meaning: '기억하다, 상기하다', pos: 'v.', ex: 'I remember our first meeting.', exTrans: '나는 우리의 첫 만남을 기억한다.' },
  { word: 'satisfy', meaning: '만족시키다, 충족하다', pos: 'v.', ex: 'The meal satisfied everyone.', exTrans: '식사는 모두를 만족시켰다.' },
  { word: 'technology', meaning: '기술, 공학', pos: 'n.', ex: 'Technology changes rapidly.', exTrans: '기술은 빠르게 변화한다.' },
];

function buildVocabList(): VocabularyWithItem[] {
  return MOCK_VOCAB_DATA.map((item, idx) => ({
    id: `voc-${idx}`,
    learningItemId: `item-${idx}`,
    passageId: null,
    word: item.word,
    meaning: item.meaning,
    partOfSpeech: item.pos || 'n.',
    pronunciation: `[${item.word}]`,
    exampleSentence: item.ex || '',
    exampleTranslation: item.exTrans || '',
    synonyms: '',
    antonyms: '',
    difficulty: 1,
    isPhrase: item.word.includes(' '),
    audioUrl: null,
    frequency: 'high',
    grade: 1,
    source: 'test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    item: {
      id: `item-${idx}`,
      type: 'vocabulary' as const,
      box: 1,
      nextReviewDate: new Date().toISOString(),
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }));
}

interface ViolationReport {
  sessionId: number;
  questionIndex: number;
  type: string;
  word: string;
  violation: string;
  detail: string;
}

async function run100Simulation() {
  console.log('🚀 [START] Running 100 Learning Sessions Simulation...\n');
  const fullVocab = buildVocabList();
  const violations: ViolationReport[] = [];

  let totalQuestionsEvaluated = 0;
  const modes: Array<'learning' | 'speed'> = ['learning', 'speed'];

  for (let session = 1; session <= 100; session++) {
    const mode = modes[session % modes.length];
    // Random sample of 10-15 vocab words for each session
    const shuffled = [...fullVocab].sort(() => Math.random() - 0.5);
    const sessionVocab = shuffled.slice(0, 10 + Math.floor(Math.random() * 5));

    const questions = generateQuestions(sessionVocab, mode, 10);
    totalQuestionsEvaluated += questions.length;

    questions.forEach((q, qIdx) => {
      const targetWord = q.word.word.toLowerCase();
      const targetStems = targetWord.split(' ');

      // Check 1: Answer Spoiler in Question Text / Korean Meaning
      // (For typing and fill_blank, the Korean meaning shown must NOT contain target English words)
      if (q.type === 'typing' || q.type === 'fill_blank') {
        const meaning = q.word.meaning.toLowerCase();
        for (const stem of targetStems) {
          if (stem.length >= 3) {
            const regex = new RegExp(`\\b${stem}\\b`, 'i');
            if (regex.test(meaning)) {
              violations.push({
                sessionId: session,
                questionIndex: qIdx + 1,
                type: q.type,
                word: q.word.word,
                violation: 'SPOILER_IN_MEANING',
                detail: `Target word "${stem}" found inside meaning: "${q.word.meaning}"`,
              });
            }
          }
        }
      }

      // Check 2: Choice Meaning Question (Meaning -> Word) Spoiler
      if (q.type === 'multiple_choice' && q.correctAnswer === q.word.word) {
        const prompt = q.questionText.toLowerCase();
        for (const stem of targetStems) {
          if (stem.length >= 3) {
            const regex = new RegExp(`\\b${stem}\\b`, 'i');
            if (regex.test(prompt)) {
              violations.push({
                sessionId: session,
                questionIndex: qIdx + 1,
                type: q.type,
                word: q.word.word,
                violation: 'SPOILER_IN_CHOICE_PROMPT',
                detail: `Target word "${stem}" found in prompt: "${q.questionText}"`,
              });
            }
          }
        }
      }

      // Check 3: Distractor Validity (4 unique options, correct answer present)
      if (q.options) {
        if (q.options.length !== 4) {
          violations.push({
            sessionId: session,
            questionIndex: qIdx + 1,
            type: q.type,
            word: q.word.word,
            violation: 'INVALID_OPTION_COUNT',
            detail: `Options count is ${q.options.length}, expected 4. Options: ${JSON.stringify(q.options)}`,
          });
        }

        const uniqueOptions = new Set(q.options);
        if (uniqueOptions.size !== q.options.length) {
          violations.push({
            sessionId: session,
            questionIndex: qIdx + 1,
            type: q.type,
            word: q.word.word,
            violation: 'DUPLICATE_OPTIONS',
            detail: `Duplicate options detected: ${JSON.stringify(q.options)}`,
          });
        }

        const hasCorrectAnswer = q.options.some(
          (opt) => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
        );
        if (!hasCorrectAnswer) {
          violations.push({
            sessionId: session,
            questionIndex: qIdx + 1,
            type: q.type,
            word: q.word.word,
            violation: 'CORRECT_ANSWER_NOT_IN_OPTIONS',
            detail: `Correct answer "${q.correctAnswer}" not found in options: ${JSON.stringify(q.options)}`,
          });
        }
      }

      // Check 4: Punctuation Glitches in Meaning / Options
      const checkPunctuation = (str: string, context: string) => {
        if (/\.,|\.\.|\s,\s|, \./.test(str)) {
          violations.push({
            sessionId: session,
            questionIndex: qIdx + 1,
            type: q.type,
            word: q.word.word,
            violation: 'PUNCTUATION_GLITCH',
            detail: `Broken punctuation in ${context}: "${str}"`,
          });
        }
      };

      checkPunctuation(q.word.meaning, 'word.meaning');
      checkPunctuation(q.correctAnswer, 'correctAnswer');
      q.options?.forEach((opt, oi) => checkPunctuation(opt, `option[${oi}]`));

      // Check 5: Sentence completion masking validity
      if (q.type === 'sentence_completion') {
        if (q.word.exampleSentence && !q.word.exampleSentence.includes('______') && !q.word.exampleSentence.includes('[ ______ ]')) {
          violations.push({
            sessionId: session,
            questionIndex: qIdx + 1,
            type: q.type,
            word: q.word.word,
            violation: 'SENTENCE_NOT_MASKED',
            detail: `Sentence was not masked: "${q.word.exampleSentence}"`,
          });
        }
      }
    });
  }

  console.log(`📊 [SUMMARY] Evaluated ${totalQuestionsEvaluated} questions across 100 simulated learning sessions.`);
  
  if (violations.length === 0) {
    console.log('✅ [SUCCESS] 100/100 Sessions Passed with 0 Violations (0 Spoilers, 0 Punctuation Glitches, 100% Valid Distractors)!');
  } else {
    console.error(`❌ [FAILURE] Found ${violations.length} violations:`);
    violations.slice(0, 10).forEach((v, i) => {
      console.error(`  #${i + 1} [Session ${v.sessionId}, Q${v.questionIndex}] ${v.violation}: ${v.detail}`);
    });
    if (violations.length > 10) {
      console.error(`  ... and ${violations.length - 10} more.`);
    }
    process.exit(1);
  }
}

run100Simulation().catch((err) => {
  console.error('Fatal simulation error:', err);
  process.exit(1);
});
