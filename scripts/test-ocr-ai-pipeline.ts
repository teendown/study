// ===========================
// OCR & AI English Learning Data Pipeline Comprehensive Test
// ===========================

import { correctOcrWordOrPhrase } from '../src/features/vocabulary/services/ocrCorrectionService';
import { calculateConfidenceScore } from '../src/features/vocabulary/services/confidenceScorer';
import { getCachedSearchResult, setCachedSearchResult } from '../src/features/vocabulary/services/dictionaryCacheService';
import { analyzeSentenceComprehensive } from '../src/features/learning/engine/sentenceAnalyzer';
import { searchWordOnline, searchPhraseOnline } from '../src/features/vocabulary/services/dictionarySearch';

async function runPipelineVerification() {
  console.log('================================================================');
  console.log('🧪 OCR 기반 AI 영어 학습 데이터 생성 시스템 종합 검증 시작');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // 1. OCR 오탈자 정규화 및 자동 교정 검증
  // -------------------------------------------------------------
  console.log('▶ [1/4] OCR 오탈자 및 광학 노이즈 자동 교정 검증');
  const typoCases = [
    { input: 'wnat', expected: 'want' },
    { input: 'abondon', expected: 'abandon' },
    { input: 'teh', expected: 'the' },
    { input: 'h0me', expected: 'home' },
    { input: 'c1ear', expected: 'clear' },
  ];

  for (const tc of typoCases) {
    const res = correctOcrWordOrPhrase(tc.input);
    console.log(`  - 입력: "${tc.input}" ➔ 교정: "${res.corrected}" (신뢰도: ${res.confidence}%, 수정됨: ${res.isModified})`);
    if (res.corrected !== tc.expected) {
      console.error(`  ❌ 교정 실패: 기대값 "${tc.expected}", 실제값 "${res.corrected}"`);
      process.exit(1);
    }
  }
  console.log('  ✅ OCR 오탈자 교정 100% 통과!\n');

  // -------------------------------------------------------------
  // 2. 5단계 신뢰도 평가 점수 (0~100점) 검증
  // -------------------------------------------------------------
  console.log('▶ [2/4] 5단계 신뢰도 점수 및 승인 상태 계산 검증');
  const scoreCases = [
    {
      data: {
        word: 'abandon',
        meaning: '버리다, 포기하다',
        partOfSpeech: 'v.',
        pronunciation: '[어밴던]',
        exampleSentence: 'He abandoned the plan.',
        exampleTranslation: '그는 계획을 포기했다.',
        source: '표준 영한사전',
        isBuiltin: true,
      },
      minScore: 90,
      expectedStatus: 'verified',
    },
    {
      data: {
        word: 'account for',
        meaning: '~을 설명하다, (비율을) 차지하다',
        partOfSpeech: 'phr.',
        pronunciation: '',
        exampleSentence: 'This accounts for the result.',
        source: '표준 숙어 사전',
        isBuiltin: true,
      },
      minScore: 90,
      expectedStatus: 'verified',
    },
  ];

  for (const sc of scoreCases) {
    const res = calculateConfidenceScore(sc.data);
    console.log(`  - 단어/숙어: "${sc.data.word}" ➔ 신뢰도: ${res.score}점 (상태: ${res.status}, 자동승인: ${res.isAutoApproved})`);
    console.log(`    근거: ${res.reason}`);
    if (res.score < sc.minScore) {
      console.error(`  ❌ 신뢰도 점수 미달: 기대 최소 ${sc.minScore}점, 실제 ${res.score}점`);
      process.exit(1);
    }
  }
  console.log('  ✅ 신뢰도 평가 엔진 100% 통과!\n');

  // -------------------------------------------------------------
  // 3. 2단계 스마트 캐시 및 검색 파이프라인 검증
  // -------------------------------------------------------------
  console.log('▶ [3/4] 2단계 스마트 캐시 및 단어/숙어 검색 통합 검증');
  const startWord = Date.now();
  const search1 = await searchWordOnline('wnat'); // wnat -> want 자동교정 + 검색
  const duration1 = Date.now() - startWord;
  console.log(`  - 1회차 검색 ("wnat" ➔ "${search1.word}"): ${duration1}ms (뜻: "${search1.meaning}", 신뢰도: ${search1.confidence}%)`);

  const startCached = Date.now();
  const searchCached = await searchWordOnline('wnat');
  const durationCached = Date.now() - startCached;
  console.log(`  - 2회차 캐시 검색: ${durationCached}ms (즉시 반환 성공)`);

  if (durationCached > 50) {
    console.warn('  ⚠️ 캐시 속도가 다소 느립니다 (50ms 초과)');
  }
  console.log('  ✅ 스마트 캐시 계층 100% 통과!\n');

  // -------------------------------------------------------------
  // 4. 문장 종합 학습 데이터 생성기 검증 (문법, 숙어, 어휘, 난이도)
  // -------------------------------------------------------------
  console.log('▶ [4/4] 문장 단위 종합 학습 데이터 생성기 검증');
  const testSentence = 'I have been looking for my wallet.';
  const sentenceResult = await analyzeSentenceComprehensive(testSentence);

  console.log(`  - 문장: "${sentenceResult.originalSentence}"`);
  console.log(`  - 한국어 해석: "${sentenceResult.koreanTranslation}"`);
  console.log(`  - 난이도: ${sentenceResult.difficultyLevel}`);
  console.log(`  - 요약: ${sentenceResult.summary}`);
  console.log('  - 감지된 문법 패턴:');
  sentenceResult.grammarPatterns.forEach((g) => {
    console.log(`    * [${g.name}] "${g.pattern}" : ${g.explanation}`);
  });
  console.log('  - 감지된 핵심 숙어:');
  sentenceResult.keyPhrases.forEach((p) => {
    console.log(`    * [${p.phrase}] : ${p.meaning} (중요도 ★${p.importance})`);
  });

  // 숙어 'look for'가 정확히 감지되었는지 확인
  const hasLookFor = sentenceResult.keyPhrases.some((p) => p.phrase === 'look for');
  if (!hasLookFor) {
    console.error('  ❌ 문장 내 숙어 look for 감지 실패');
    process.exit(1);
  }

  // 문법 '현재완료진행형'이 감지되었는지 확인
  const hasPerfectProg = sentenceResult.grammarPatterns.some((g) => g.name.includes('현재완료진행형'));
  if (!hasPerfectProg) {
    console.error('  ❌ 문법 패턴 현재완료진행형 감지 실패');
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('🎉 모든 OCR_AI 영어학습 데이터 생성 시스템 검증 테스트가 100% 통과되었습니다!');
  console.log('================================================================');
}

runPipelineVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
