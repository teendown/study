'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';
import type { DailyStudyStat } from '../types';

interface StudyTrendChartProps {
  data: DailyStudyStat[];
}

export function StudyTrendChart({ data }: StudyTrendChartProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              주간 학습 시간 및 푼 문제 수
            </CardTitle>
            <CardDescription className="text-xs">
              최근 7일간의 학습 패턴과 문제 풀이 추이
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => [
                  name === 'studyMinutes' ? `${value}분` : `${value}문제`,
                  name === 'studyMinutes' ? '학습 시간' : '푼 문제 수',
                ]}
              />
              <Legend
                verticalAlign="top"
                height={30}
                formatter={(val) => (val === 'studyMinutes' ? '학습 시간 (분)' : '푼 문제 수')}
              />
              <Bar dataKey="studyMinutes" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="questionsAnswered" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
