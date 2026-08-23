'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target } from 'lucide-react';
import type { DifficultyStat } from '../types';

interface DifficultyChartProps {
  data: DifficultyStat[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

export function DifficultyChart({ data }: DifficultyChartProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-500" />
          난이도별 정답률 분석
        </CardTitle>
        <CardDescription className="text-xs">
          ⭐1(매우 쉬움)부터 ⭐5(고난도)까지의 어휘 정확도
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
              <XAxis type="number" domain={[0, 100]} unit="%" fontSize={11} />
              <YAxis dataKey="difficulty" type="category" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any, item: any) => [
                  `${value}% (${item.payload.correct}/${item.payload.total}문제)`,
                  '정답률',
                ]}
              />
              <Bar dataKey="accuracy" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
