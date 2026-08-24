'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  HeartHandshake,
  Trophy,
  Sliders,
  Sparkles,
  Volume2,
  Bell,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  StudyTrendChart,
  DifficultyChart,
  ParentReportCard,
  getStatisticsDataAction,
  type StatisticsData,
} from '@/features/statistics';
import {
  AchievementList,
  getAchievementsAction,
  type AchievementItem,
} from '@/features/game';
import { BackgroundSettingsDialog } from '@/features/theme/components/BackgroundSettingsDialog';
import { useBackgroundTheme } from '@/features/theme/hooks/useBackgroundTheme';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'parent' | 'achievements' | 'config'>('stats');

  const [statsData, setStatsData] = useState<StatisticsData | null>(null);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoTtsEnabled, setAutoTtsEnabled] = useState(true);
  const [isBgDialogOpen, setIsBgDialogOpen] = useState(false);

  const { config, currentImageUrl } = useBackgroundTheme();

  const loadData = useCallback(async () => {
    const sRes = await getStatisticsDataAction();
    if (sRes.success && sRes.data) setStatsData(sRes.data);

    const aRes = await getAchievementsAction();
    if (aRes.success && aRes.data) setAchievements(aRes.data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearData = () => {
    if (confirm('모든 로컬 학습 기록을 초기화하시겠습니까? (단어장은 유지됩니다)')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('study_quest_sessions_v1');
        localStorage.removeItem('study_quest_progress_v1');
        alert('학습 기록이 초기화되었습니다.');
        window.location.reload();
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">통계 & 설정</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          학습 성장 통계와 학부모 리포트, 업적 도감 및 테마 설정을 관리하세요
        </p>
      </div>

      {/* 4가지 상단 탭 버튼 */}
      <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl overflow-x-auto no-scrollbar">
        <Button
          variant={activeTab === 'stats' ? 'default' : 'ghost'}
          size="sm"
          className="font-bold gap-1.5 rounded-lg text-xs shrink-0"
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 className="h-4 w-4" />
          학습 통계
        </Button>
        <Button
          variant={activeTab === 'parent' ? 'default' : 'ghost'}
          size="sm"
          className="font-bold gap-1.5 rounded-lg text-xs shrink-0"
          onClick={() => setActiveTab('parent')}
        >
          <HeartHandshake className="h-4 w-4" />
          학부모 리포트
        </Button>
        <Button
          variant={activeTab === 'achievements' ? 'default' : 'ghost'}
          size="sm"
          className="font-bold gap-1.5 rounded-lg text-xs shrink-0"
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy className="h-4 w-4" />
          업적 도감
        </Button>
        <Button
          variant={activeTab === 'config' ? 'default' : 'ghost'}
          size="sm"
          className="font-bold gap-1.5 rounded-lg text-xs shrink-0"
          onClick={() => setActiveTab('config')}
        >
          <Sliders className="h-4 w-4" />
          앱 설정
        </Button>
      </div>

      {/* ────────────────────────────────────
          1. 학습 통계 탭
         ──────────────────────────────────── */}
      {activeTab === 'stats' && statsData && (
        <div className="space-y-4">
          <StudyTrendChart data={statsData.weeklyTrend} />
          <DifficultyChart data={statsData.difficultyStats} />
        </div>
      )}

      {/* ────────────────────────────────────
          2. 학부모 리포트 탭
         ──────────────────────────────────── */}
      {activeTab === 'parent' && statsData && (
        <ParentReportCard report={statsData.parentReport} />
      )}

      {/* ────────────────────────────────────
          3. 업적 도감 탭
         ──────────────────────────────────── */}
      {activeTab === 'achievements' && (
        <AchievementList achievements={achievements} />
      )}

      {/* ────────────────────────────────────
          4. 앱 설정 탭
         ──────────────────────────────────── */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          {/* 🌟 커스텀 배경화면 & 내 사진 설정 카드 */}
          <Card className="border-primary/30 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                배경화면 테마 & 내 사진 설정
              </CardTitle>
              <CardDescription className="text-xs">
                소장하고 있는 사진 파일을 불러와 전역 배경으로 등록하거나 추천 테마로 변경할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-16 rounded-lg bg-cover bg-center border border-border shrink-0 shadow-2xs"
                    style={{ backgroundImage: `url(${currentImageUrl})` }}
                  />
                  <div>
                    <span className="font-semibold block text-xs">
                      {config.type === 'custom' ? '📸 내 사진 적용 중' : config.type === 'preset' ? '🎨 추천 테마 적용 중' : '기본 학습 배경'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      투명도 {Math.round(config.overlayOpacity * 100)}% · 흐림 {config.blur}px
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsBgDialogOpen(true)}
                  className="font-bold gap-1.5 text-xs h-8 bg-primary"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  배경 변경하기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 학습 환경 설정 카드 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">학습 환경 설정</CardTitle>
              <CardDescription className="text-xs">
                발음 음성 및 효과음 설정을 변경합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-0.5">
                  <span className="font-semibold block">정답 효과음</span>
                  <span className="text-xs text-muted-foreground">문제 풀이 시 효과음을 재생합니다.</span>
                </div>
                <Button
                  variant={soundEnabled ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs font-bold"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? '켜짐' : '꺼짐'}
                </Button>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-0.5">
                  <span className="font-semibold block">영어 발음(TTS) 자동 재생</span>
                  <span className="text-xs text-muted-foreground">단어 카드가 나타날 때 원어민 발음을 즉시 재생합니다.</span>
                </div>
                <Button
                  variant={autoTtsEnabled ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs font-bold"
                  onClick={() => setAutoTtsEnabled(!autoTtsEnabled)}
                >
                  {autoTtsEnabled ? '켜짐' : '꺼짐'}
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold text-destructive hover:text-destructive border-destructive/40 gap-1.5"
                  onClick={handleClearData}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  학습 진행도 데이터 초기화
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 배경 사진 설정 모달 */}
      <BackgroundSettingsDialog
        open={isBgDialogOpen}
        onOpenChange={setIsBgDialogOpen}
      />
    </div>
  );
}
