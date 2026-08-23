// ===========================
// Game & Achievement Types
// ===========================
// 설계서 섹션 7.10, 7.11, 16, 17 기반

export interface AchievementItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  xpReward: number;
  conditionType: string;
  conditionValue: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progressValue: number; // 현재 진행 수치 (예: 10/100)
}

export interface LevelInfo {
  level: number;
  currentXp: number;
  levelStartXp: number;
  nextLevelXp: number;
  progressPercent: number;
  remainingXp: number;
}

export interface DashboardData {
  user: {
    name: string;
    level: number;
    xp: number;
    streak: number;
    levelInfo: LevelInfo;
  };
  dailyGoal: {
    reviewWords: number;
    reviewWordsTarget: number;
    newWords: number;
    newWordsTarget: number;
    questions: number;
    questionsTarget: number;
    studyMinutes: number;
    studyMinutesTarget: number;
    isAllCompleted: boolean;
  };
  recommendation: {
    dueReviewCount: number;
    weakWordCount: number;
    newWordCount: number;
  };
  recentAchievements: AchievementItem[];
}
