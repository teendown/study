'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ModeSelector,
  StudySession,
  StudyResult,
  SpeedShadowing,
  generateQuestions,
  saveStudySessionAction,
  type GeneratedQuestion,
  type SessionSummary,
} from '@/features/learning';
import { getVocabulariesAction } from '@/features/vocabulary/services';
import type { VocabularyWithItem } from '@/features/vocabulary/types';
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

function StudyContent() {
  const searchParams = useSearchParams();
  const initialModeParam = (searchParams.get('mode') as StudyMode) || 'learning';

  // 뷰 상태: 'selector' | 'studying' | 'shadowing' | 'result'
  const [viewState, setViewState] = useState<'selector' | 'studying' | 'shadowing' | 'result'>('selector');
  const [vocabList, setVocabList] = useState<VocabularyWithItem[]>(DEFAULT_FALLBACK_VOCAB);
  const [isLoading, setIsLoading] = useState(false);

  // 세션 상태
  const [activeMode, setActiveMode] = useState<StudyMode>(initialModeParam);
  const [activeQuestions, setActiveQuestions] = useState<GeneratedQuestion[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [targetShadowingList, setTargetShadowingList] = useState<VocabularyWithItem[]>([]);

  // 단어 목록 로드
  const loadVocabs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getVocabulariesAction({ limit: 100 });
      if (res.success && res.data && res.data.items.length > 0) {
        setVocabList(res.data.items);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVocabs();
  }, [loadVocabs]);

  // 학습 시작 (일반 퀴즈 vs 스피드 섀도잉)
  const handleStartSession = (
    mode: StudyMode | 'speed_shadowing',
    count: number,
    customVocabs?: VocabularyWithItem[]
  ) => {
    const targetVocabs = customVocabs && customVocabs.length > 0 ? customVocabs : vocabList;

    if (mode === 'speed_shadowing') {
      const sliced = targetVocabs.slice(0, count);
      setTargetShadowingList(sliced);
      setViewState('shadowing');
      return;
    }

    const questions = generateQuestions(targetVocabs, mode as StudyMode, count);
    if (questions.length === 0) {
      alert('출제할 수 있는 단어가 부족합니다.');
      return;
    }

    setActiveMode(mode as StudyMode);
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

  // 일반 문제 세션 완료
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
    handleStartSession(activeMode, sessionSummary.wrongItems.length, sessionSummary.wrongItems);
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
      {viewState === 'selector' && (
        <ModeSelector
          onStart={(mode, count) => handleStartSession(mode, count)}
          totalVocabCount={vocabList.length}
        />
      )}

      {/* 1. 일반 / 스피드 퀴즈 세션 */}
      {viewState === 'studying' && activeQuestions.length > 0 && (
        <StudySession
          questions={activeQuestions}
          mode={activeMode}
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

      {/* 3. 학습 결과 리포트 */}
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
