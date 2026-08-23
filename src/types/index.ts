// ===========================
// STUDY QUEST 공통 타입 정의
// ===========================

/** 사용자 역할 */
export type UserRole = 'student' | 'parent' | 'admin';

/** 과목 코드 */
export type SubjectCode = 'ENGLISH' | 'MATH' | 'KOREAN' | 'SCIENCE' | 'SOCIAL';

/** 학습 항목 유형 */
export type LearningItemType =
  | 'vocabulary'
  | 'phrase'
  | 'grammar'
  | 'reading'
  | 'problem'
  | 'concept'
  | 'formula';

/** 문제 유형 */
export type QuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'spelling'
  | 'listening'
  | 'translation'
  | 'sentence_completion'
  | 'matching'
  | 'typing';

/** 학습 모드 */
export type StudyMode = 'learning' | 'review' | 'speed' | 'test';

/** 난이도 */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** 숙련도 등급 */
export type MasteryLevel =
  | 'unlearned'      // 0~20
  | 'learning'       // 21~40
  | 'average'        // 41~60
  | 'skilled'        // 61~80
  | 'highly_skilled' // 81~95
  | 'master';        // 96~100

/** 네비게이션 아이템 */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

/** 일일 목표 */
export interface DailyGoal {
  reviewWords: number;
  reviewWordsTarget: number;
  newWords: number;
  newWordsTarget: number;
  questions: number;
  questionsTarget: number;
  studyMinutes: number;
  studyMinutesTarget: number;
}
