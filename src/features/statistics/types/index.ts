// ===========================
// Statistics & Report Types
// ===========================
// 설계서 섹션 20, 21, 51 기반

export interface DailyStudyStat {
  day: string; // '월', '화', '수', '목', '금', '토', '일'
  date: string; // '2026-08-24'
  studyMinutes: number; // 학습 시간 (분)
  questionsAnswered: number; // 푼 문제 수
  accuracy: number; // 정답률 (%)
}

export interface DifficultyStat {
  difficulty: string; // '⭐1 기초', '⭐2 쉬움', '⭐3 보통', '⭐4 심화', '⭐5 고난도'
  correct: number;
  total: number;
  accuracy: number;
}

export interface ParentWeeklyReport {
  weekLabel: string; // '8월 4주차 학습 리포트'
  studentName: string;
  totalStudyMinutes: number;
  totalWordsLearned: number;
  totalQuestionsAnswered: number;
  averageAccuracy: number;
  streakDays: number;
  targetCompletionRate: number; // 주간 목표 달성률 (%)
  aiCoachingComment: string; // AI 맞춤 격려 및 지도 조언
  topWeakWords: { word: string; meaning: string; wrongCount: number }[];
}

export interface StatisticsData {
  weeklyTrend: DailyStudyStat[];
  difficultyStats: DifficultyStat[];
  parentReport: ParentWeeklyReport;
}
