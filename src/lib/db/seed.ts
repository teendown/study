// ===========================
// Seed 데이터
// ===========================
// 초기 과목 및 업적 데이터
//
// 실행 방법:
// TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN 설정 후
// npx tsx src/lib/db/seed.ts

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

async function seed() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('❌ TURSO_DATABASE_URL 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  console.log('🌱 Seed 데이터 입력을 시작합니다...\n');

  // ─────────────────────────────
  // 1. 과목 (Subjects)
  // ─────────────────────────────
  console.log('📚 과목 데이터 입력...');
  const subjectsData = [
    {
      code: 'ENGLISH' as const,
      name: '영어',
      description: '고등학교 영어 단어, 숙어, 문법, 독해',
      icon: '🇺🇸',
      isActive: true,
    },
    {
      code: 'MATH' as const,
      name: '수학',
      description: '고등학교 수학 개념, 공식, 문제 풀이',
      icon: '📐',
      isActive: false,
    },
    {
      code: 'KOREAN' as const,
      name: '국어',
      description: '고등학교 국어 어휘, 문법, 문학, 독해',
      icon: '📖',
      isActive: false,
    },
    {
      code: 'SCIENCE' as const,
      name: '과학',
      description: '고등학교 과학 개념, 용어, 문제',
      icon: '🔬',
      isActive: false,
    },
    {
      code: 'SOCIAL' as const,
      name: '사회',
      description: '고등학교 사회 개념, 용어, 문제',
      icon: '🌏',
      isActive: false,
    },
  ];

  for (const subject of subjectsData) {
    await db
      .insert(schema.subjects)
      .values(subject)
      .onConflictDoNothing({ target: schema.subjects.code });
  }
  console.log(`  ✅ ${subjectsData.length}개 과목 완료\n`);

  // ─────────────────────────────
  // 2. 업적 (Achievements)
  // ─────────────────────────────
  console.log('🏆 업적 데이터 입력...');
  const achievementsData = [
    // 단어 관련
    {
      code: 'FIRST_WORD',
      name: '첫 단어',
      description: '첫 번째 단어를 학습했습니다!',
      icon: '🌟',
      xpReward: 50,
      conditionType: 'total_words' as const,
      conditionValue: 1,
    },
    {
      code: 'WORDS_100',
      name: '100단어 달성',
      description: '100개의 단어를 학습했습니다!',
      icon: '📚',
      xpReward: 200,
      conditionType: 'total_words' as const,
      conditionValue: 100,
    },
    {
      code: 'WORDS_500',
      name: '500단어 달성',
      description: '500개의 단어를 학습했습니다!',
      icon: '📖',
      xpReward: 500,
      conditionType: 'total_words' as const,
      conditionValue: 500,
    },
    {
      code: 'WORDS_1000',
      name: '1000단어 마스터',
      description: '1000개의 단어를 학습했습니다! 대단해요!',
      icon: '🎓',
      xpReward: 1000,
      conditionType: 'total_words' as const,
      conditionValue: 1000,
    },
    // 문제 관련
    {
      code: 'QUESTIONS_10',
      name: '첫 10문제',
      description: '10개의 문제를 풀었습니다!',
      icon: '✏️',
      xpReward: 30,
      conditionType: 'total_questions' as const,
      conditionValue: 10,
    },
    {
      code: 'QUESTIONS_100',
      name: '100문제 달성',
      description: '100개의 문제를 풀었습니다!',
      icon: '📝',
      xpReward: 150,
      conditionType: 'total_questions' as const,
      conditionValue: 100,
    },
    {
      code: 'QUESTIONS_1000',
      name: '1000문제 달성',
      description: '1000개의 문제를 풀었습니다! 엄청나요!',
      icon: '🏅',
      xpReward: 500,
      conditionType: 'total_questions' as const,
      conditionValue: 1000,
    },
    // 연속 학습
    {
      code: 'STREAK_7',
      name: '7일 연속 학습',
      description: '7일 연속으로 학습했습니다!',
      icon: '🔥',
      xpReward: 200,
      conditionType: 'streak_days' as const,
      conditionValue: 7,
    },
    {
      code: 'STREAK_14',
      name: '14일 연속 학습',
      description: '2주 연속으로 학습했습니다!',
      icon: '🔥',
      xpReward: 400,
      conditionType: 'streak_days' as const,
      conditionValue: 14,
    },
    {
      code: 'STREAK_30',
      name: '30일 연속 학습',
      description: '한 달 연속으로 학습했습니다! 놀라워요!',
      icon: '💎',
      xpReward: 1000,
      conditionType: 'streak_days' as const,
      conditionValue: 30,
    },
    // 연속 정답
    {
      code: 'COMBO_10',
      name: '10연속 정답',
      description: '10문제를 연속으로 맞혔습니다!',
      icon: '⚡',
      xpReward: 100,
      conditionType: 'consecutive_correct' as const,
      conditionValue: 10,
    },
    {
      code: 'COMBO_50',
      name: '50연속 정답',
      description: '50문제를 연속으로 맞혔습니다! 완벽해요!',
      icon: '🌈',
      xpReward: 300,
      conditionType: 'consecutive_correct' as const,
      conditionValue: 50,
    },
    {
      code: 'COMBO_100',
      name: '100연속 정답',
      description: '100문제를 연속으로 맞혔습니다! 전설이에요!',
      icon: '👑',
      xpReward: 1000,
      conditionType: 'consecutive_correct' as const,
      conditionValue: 100,
    },
    // 정답률
    {
      code: 'ACCURACY_90',
      name: '정답률 90%',
      description: '전체 정답률이 90%를 달성했습니다!',
      icon: '🎯',
      xpReward: 300,
      conditionType: 'accuracy_rate' as const,
      conditionValue: 90,
    },
    {
      code: 'ACCURACY_95',
      name: '정답률 95%',
      description: '전체 정답률이 95%를 달성했습니다!',
      icon: '💯',
      xpReward: 500,
      conditionType: 'accuracy_rate' as const,
      conditionValue: 95,
    },
  ];

  for (const achievement of achievementsData) {
    await db
      .insert(schema.achievements)
      .values(achievement)
      .onConflictDoNothing({ target: schema.achievements.code });
  }
  console.log(`  ✅ ${achievementsData.length}개 업적 완료\n`);

  console.log('🎉 Seed 완료!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed 실패:', err);
  process.exit(1);
});
