// ===========================
// Statistics & Report Services
// ===========================

import type { StatisticsData, DailyStudyStat, DifficultyStat, ParentWeeklyReport } from '../types';

export async function getStatisticsDataAction(): Promise<{
  success: boolean;
  data: StatisticsData;
  error?: string;
}> {
  // 요일별 최근 7일 통계 데이터
  const weeklyTrend: DailyStudyStat[] = [
    { day: '월', date: '08-18', studyMinutes: 25, questionsAnswered: 30, accuracy: 88 },
    { day: '화', date: '08-19', studyMinutes: 30, questionsAnswered: 40, accuracy: 92 },
    { day: '수', date: '08-20', studyMinutes: 20, questionsAnswered: 25, accuracy: 84 },
    { day: '목', date: '08-21', studyMinutes: 35, questionsAnswered: 45, accuracy: 95 },
    { day: '금', date: '08-22', studyMinutes: 40, questionsAnswered: 50, accuracy: 90 },
    { day: '토', date: '08-23', studyMinutes: 45, questionsAnswered: 55, accuracy: 94 },
    { day: '일', date: '08-24', studyMinutes: 30, questionsAnswered: 35, accuracy: 91 },
  ];

  // 난이도별 정답률 통계
  const difficultyStats: DifficultyStat[] = [
    { difficulty: '⭐1 매우 쉬움', correct: 48, total: 50, accuracy: 96 },
    { difficulty: '⭐2 쉬움', correct: 75, total: 82, accuracy: 91 },
    { difficulty: '⭐3 보통', correct: 62, total: 72, accuracy: 86 },
    { difficulty: '⭐4 어려움', correct: 34, total: 45, accuracy: 75 },
    { difficulty: '⭐5 고난도', correct: 18, total: 28, accuracy: 64 },
  ];

  // 부모님 주간 학습 브리핑 리포트
  const parentReport: ParentWeeklyReport = {
    weekLabel: '8월 4주차 주간 학습 리포트',
    studentName: '다은',
    totalStudyMinutes: 225,
    totalWordsLearned: 142,
    totalQuestionsAnswered: 280,
    averageAccuracy: 90.6,
    streakDays: 8,
    targetCompletionRate: 94,
    aiCoachingComment:
      '다은 학생은 이번 주 7일 연속으로 꾸준히 학습 목표를 완수했습니다! 특히 ⭐1~3 난이도 어휘의 정답률이 90% 이상으로 매우 탄탄하며, 스피드 섀도잉 학습을 통해 발음과 단어 직관력이 크게 향상되었습니다.',
    topWeakWords: [
      { word: 'compensate', meaning: '보상하다, 보완하다', wrongCount: 3 },
      { word: 'comprehend', meaning: '이해하다, 파악하다', wrongCount: 2 },
      { word: 'inevitable', meaning: '불가피한, 필연적인', wrongCount: 2 },
    ],
  };

  return {
    success: true,
    data: {
      weeklyTrend,
      difficultyStats,
      parentReport,
    },
  };
}
