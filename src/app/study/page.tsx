'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ModeSelector,
  StudySession,
  StudyResult,
  SpeedShadowing,
  WordPickerModal,
  PassageClozeSession,
  StudyStartConfigDialog,
  type StudyStartConfig,
  generateQuestions,
  saveStudySessionAction,
  type GeneratedQuestion,
  type SessionSummary,
} from '@/features/learning';
import {
  getVocabulariesAction,
  getPassagesAction,
} from '@/features/vocabulary/services';
import type { VocabularyWithItem } from '@/features/vocabulary/types';
import type { PassageItem } from '@/features/vocabulary/types/passageTypes';
import type { StudyMode } from '@/types';
import { Loader2 } from 'lucide-react';

const DEFAULT_FALLBACK_VOCAB: VocabularyWithItem[] = [
  {
    id: 's1',
    word: 'abandon',
    meaning: '포기하다, 버리다',
    partOfSpeech: 'v.',
    pronunciation: '[əˈbændən]',
    audioUrl: null,
    exampleSentence: 'He decided to abandon the plan.',
    exampleTranslation: '그는 계획을 포기하기로 결정했다.',
    synonyms: 'give up',
    antonyms: 'maintain',
    frequency: 'high',
    difficulty: 2,
    grade: 10,
    source: '고1 어휘',
    learningItemId: 'item-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 's2',
    word: 'significant',
    meaning: '중요한, 상당한',
    partOfSpeech: 'adj.',
    pronunciation: '[sɪɡˈnɪfɪkənt]',
    audioUrl: null,
    exampleSentence: 'A significant increase in score.',
    exampleTranslation: '성적의 상당한 향상.',
    synonyms: 'important',
    antonyms: 'trivial',
    frequency: 'high',
    difficulty: 3,
    grade: 10,
    source: '고1 어휘',
    learningItemId: 'item-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 's3',
    word: 'contribute',
    meaning: '기여하다, 공헌하다',
    partOfSpeech: 'v.',
    pronunciation: '[kənˈtrɪbjuːt]',
    audioUrl: null,
    exampleSentence: 'Hard work contributed to success.',
    exampleTranslation: '노력이 성공에 기여했다.',
    synonyms: 'support',
    antonyms: 'detract',
    frequency: 'high',
    difficulty: 3,
    grade: 10,
    source: '고1 어휘',
    learningItemId: 'item-3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 's4',
    word: 'maintain',
    meaning: '유지하다, 지속하다',
    partOfSpeech: 'v.',
    pronunciation: '[meɪnˈteɪn]',
    audioUrl: null,
    exampleSentence: 'Maintain a good habit.',
    exampleTranslation: '좋은 습관을 유지하다.',
    synonyms: 'preserve, keep',
    antonyms: 'abandon',
    frequency: 'high',
    difficulty: 2,
    grade: 10,
    source: '고1 어휘',
    learningItemId: 'item-4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 's5',
    word: 'environment',
    meaning: '환경, 자연',
    partOfSpeech: 'n.',
    pronunciation: '[ɪnˈvaɪrənmənt]',
    audioUrl: null,
    exampleSentence: 'Protect our environment.',
    exampleTranslation: '우리의 환경을 보호하자.',
    synonyms: 'surroundings',
    antonyms: null,
    frequency: 'high',
    difficulty: 1,
    grade: 10,
    source: '고1 어휘',
    learningItemId: 'item-5',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_FALLBACK_PASSAGES: PassageItem[] = [
  {
    id: 'passage-1',
    title: 'The Power of Habit (습관의 힘)',
    content: `Habits are the small decisions you make and actions you perform every day. According to researchers, habits account for about 40 percent of our behaviors on any given day. Your life today is essentially the sum of your habits. How in shape or out of shape you are? A result of your habits. How happy or unhappy you are? A result of your habits. What you repeatedly do ultimately forms the person you are, the things you believe, and the personality that you portray. By changing your daily habits, you can transform your entire life.`,
    translation:
      '습관은 여러분이 매일 내리는 작은 결정과 행동들입니다. 연구원들에 따르면, 습관은 하루 행동의 약 40퍼센트를 차지합니다. 여러분의 오늘의 삶은 본질적으로 습관의 총합입니다. 당신이 얼마나 건강한지, 행복한지는 모두 습관의 결과입니다. 매일의 습관을 바꿈으로써 여러분은 인생 전체를 변화시킬 수 있습니다.',
    sentences: [
      'Habits are the small decisions you make and actions you perform every day.',
      'According to researchers, habits account for about 40 percent of our behaviors on any given day.',
      'Your life today is essentially the sum of your habits.',
      'How in shape or out of shape you are? A result of your habits.',
      'How happy or unhappy you are? A result of your habits.',
      'What you repeatedly do ultimately forms the person you are, the things you believe, and the personality that you portray.',
      'By changing your daily habits, you can transform your entire life.',
    ],
    vocabularyList: [
      'habit',
      'decision',
      'perform',
      'researcher',
      'behavior',
      'essentially',
      'ultimately',
      'transform',
      'repeatedly',
      'portray',
      'percent',
      'personality',
      'believe',
      'action',
    ],
    difficulty: 2,
    grade: 10,
    source: '고1 영어 모의고사',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function StudyContent() {
  const searchParams = useSearchParams();
  const initialModeParam =
    (searchParams.get('mode') as StudyMode | 'speed_shadowing' | 'passage_cloze') ||
    'passage_cloze';

  // 뷰 상태: 'selector' | 'studying' | 'shadowing' | 'cloze' | 'result'
  const [viewState, setViewState] = useState<
    'selector' | 'studying' | 'shadowing' | 'cloze' | 'result'
  >('selector');

  const [vocabList, setVocabList] = useState<VocabularyWithItem[]>(DEFAULT_FALLBACK_VOCAB);
  const [passages, setPassages] = useState<PassageItem[]>(DEFAULT_FALLBACK_PASSAGES);
  const [isLoading, setIsLoading] = useState(false);

  // 팝업 설정 상태
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedModeForDialog, setSelectedModeForDialog] = useState<
    StudyMode | 'speed_shadowing' | 'passage_cloze'
  >(initialModeParam);

  // 세션 상태
  const [activeMode, setActiveMode] = useState<StudyMode | 'speed_shadowing' | 'passage_cloze'>(
    initialModeParam
  );
  const [activeQuestions, setActiveQuestions] = useState<GeneratedQuestion[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [targetShadowingList, setTargetShadowingList] = useState<VocabularyWithItem[]>([]);

  // 지문 빈칸 채우기 세션 상태
  const [activePassageForCloze, setActivePassageForCloze] = useState<PassageItem | null>(null);
  const [activeClozeRounds, setActiveClozeRounds] = useState<number>(1);
  const [activeClozeType, setActiveClozeType] = useState<'choice' | 'chips' | 'typing'>('choice');
  const [activeBlankDensity, setActiveBlankDensity] = useState<
    'keywords' | 'one_per_sentence' | 'two_per_sentence'
  >('keywords');

  // 단어 직접 선택 상태
  const [isWordPickerOpen, setIsWordPickerOpen] = useState(false);
  const [selectedCustomVocabs, setSelectedCustomVocabs] = useState<VocabularyWithItem[]>([]);

  // 데이터 로드 (단어 & 지문)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vocabRes, passageRes] = await Promise.all([
        getVocabulariesAction({ limit: 100 }),
        getPassagesAction(),
      ]);

      if (vocabRes.success && vocabRes.data && vocabRes.data.items.length > 0) {
        setVocabList(vocabRes.data.items);
      }

      if (passageRes.success && passageRes.data && passageRes.data.items.length > 0) {
        setPassages(passageRes.data.items);
      }
    } catch {
      // fallback to initial data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 학습 시작 팝업 열기 핸들러
  const handleRequestStartPopup = (mode: StudyMode | 'speed_shadowing' | 'passage_cloze') => {
    setSelectedModeForDialog(mode);
    setIsConfigDialogOpen(true);
  };

  // 팝업에서 횟수/옵션 확정 후 학습 시작
  const handleConfirmStart = (config: StudyStartConfig) => {
    const { mode, count, selectedPassage, repeatRounds, questionType, blankDensity, customVocabs } = config;
    const targetVocabs = customVocabs && customVocabs.length > 0 ? customVocabs : vocabList;

    setActiveMode(mode);

    // 1. 지문 빈칸 채우기 모드
    if (mode === 'passage_cloze') {
      const passageToUse = selectedPassage || passages[0] || DEFAULT_FALLBACK_PASSAGES[0];
      setActivePassageForCloze(passageToUse);
      setActiveClozeRounds(repeatRounds || 1);
      setActiveClozeType(questionType || 'choice');
      setActiveBlankDensity(blankDensity || 'keywords');
      setViewState('cloze');
      return;
    }

    // 2. 스피드 섀도잉 모드
    if (mode === 'speed_shadowing') {
      const sliced = targetVocabs.slice(0, count);
      setTargetShadowingList(sliced);
      setViewState('shadowing');
      return;
    }

    // 3. 일반/스피드/복습 퀴즈 모드
    const questions = generateQuestions(targetVocabs, mode as StudyMode, count);
    if (questions.length === 0) {
      alert('출제할 수 있는 단어가 부족합니다.');
      return;
    }

    setActiveQuestions(questions);
    setViewState('studying');
  };

  // 섀도잉 완주 시
  const handleFinishShadowing = (xpEarned: number, totalCount: number) => {
    const dummySummary: SessionSummary = {
      mode: 'speed',
      totalQuestions: totalCount,
      correctCount: totalCount,
      wrongCount: 0,
      accuracy: 100,
      totalXpEarned: xpEarned,
      maxCombo: totalCount,
      totalTimeSeconds: Math.round(totalCount * 2.5),
      answers: [],
      wrongItems: [],
    };
    handleFinishSession(dummySummary);
  };

  // 세션 완료 리포트 처리
  const handleFinishSession = async (summary: SessionSummary) => {
    setSessionSummary(summary);
    setViewState('result');

    try {
      await saveStudySessionAction(summary);
    } catch {}
  };

  const handleRetry = () => {
    setViewState('selector');
  };

  const handleRetryWrongOnly = () => {
    if (!sessionSummary || sessionSummary.wrongItems.length === 0) return;
    handleConfirmStart({
      mode: activeMode,
      count: sessionSummary.wrongItems.length,
      customVocabs: sessionSummary.wrongItems,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-2">
      {/* 0. 학습 모드 선택 화면 */}
      {viewState === 'selector' && (
        <>
          <ModeSelector
            onStart={(mode, count, custom) =>
              handleConfirmStart({ mode, count, customVocabs: custom })
            }
            onRequestStartPopup={handleRequestStartPopup}
            totalVocabCount={vocabList.length}
            totalPassageCount={passages.length}
            onOpenWordPicker={() => setIsWordPickerOpen(true)}
            selectedCustomVocabs={selectedCustomVocabs}
            onClearCustomVocabs={() => setSelectedCustomVocabs([])}
          />

          {/* 단어 직접 선택 모달 */}
          <WordPickerModal
            open={isWordPickerOpen}
            onOpenChange={setIsWordPickerOpen}
            allVocabs={vocabList}
            onConfirm={(chosen: VocabularyWithItem[]) => setSelectedCustomVocabs(chosen)}
          />

          {/* 🌟 학습 횟수 & 옵션 설정 팝업 다이얼로그 */}
          <StudyStartConfigDialog
            open={isConfigDialogOpen}
            onOpenChange={setIsConfigDialogOpen}
            selectedMode={selectedModeForDialog}
            totalVocabCount={vocabList.length}
            selectedCustomVocabs={selectedCustomVocabs}
            passages={passages}
            onConfirmStart={handleConfirmStart}
          />
        </>
      )}

      {/* 1. 일반 / 스피드 퀴즈 세션 */}
      {viewState === 'studying' && activeQuestions.length > 0 && (
        <StudySession
          questions={activeQuestions}
          mode={activeMode as StudyMode}
          onFinish={handleFinishSession}
          onExit={() => setViewState('selector')}
        />
      )}

      {/* 2. 스피드 섀도잉 모드 (따라 말하기) */}
      {viewState === 'shadowing' && targetShadowingList.length > 0 && (
        <SpeedShadowing
          vocabList={targetShadowingList}
          onFinish={handleFinishShadowing}
          onExit={() => setViewState('selector')}
        />
      )}

      {/* 3. 🌟 지문 빈칸 채우기 세션 (Passage Cloze) */}
      {viewState === 'cloze' && activePassageForCloze && (
        <PassageClozeSession
          passage={activePassageForCloze}
          repeatRounds={activeClozeRounds}
          questionType={activeClozeType}
          blankDensity={activeBlankDensity}
          onFinish={handleFinishSession}
          onExit={() => setViewState('selector')}
        />
      )}

      {/* 4. 학습 결과 리포트 */}
      {viewState === 'result' && sessionSummary && (
        <StudyResult
          summary={sessionSummary}
          onRetry={handleRetry}
          onRetryWrongOnly={
            sessionSummary.wrongItems.length > 0 ? handleRetryWrongOnly : undefined
          }
        />
      )}
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <StudyContent />
    </Suspense>
  );
}
