import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { MonthlyPerformance } from '../types';

interface MonthlySalesTrendProps {
  monthlyPerformance: MonthlyPerformance[];
}

const MonthlySalesTrend: React.FC<MonthlySalesTrendProps> = ({ monthlyPerformance }) => {
  // 월별 판매액 추이 (2024년과 2025년 비교)
  const monthlyData = useMemo(() => {
    if (!monthlyPerformance || monthlyPerformance.length === 0) {
      return [];
    }

    return monthlyPerformance.map((item) => {
      const 올해 = item.revenue || 0;
      const 작년 = item.target || 0; // target이 전년 매출
      const 신장률 = item.growthRate !== undefined ? item.growthRate : (작년 > 0 ? ((올해 - 작년) / 작년) * 100 : 0);
      
      return {
        월: item.month,
        올해,
        작년,
        신장률: Math.round(신장률 * 10) / 10
      };
    });
  }, [monthlyPerformance]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-slate-100 text-xs">
          <p className="font-bold text-slate-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === '신장률') {
              return (
                <p key={index} className="text-slate-700">
                  {entry.name}: <span className="font-semibold">{entry.value >= 0 ? '+' : ''}{entry.value.toFixed(1)}%</span>
                </p>
              );
            }
            return (
              <p key={index} className="text-slate-700">
                {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}만원</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
        월별 판매 추이 (전년 대비)
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="월" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: '매출 (만원)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: '#64748b' } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#f97316' }}
              label={{ value: '신장률 (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 10, fill: '#f97316' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="올해" fill="#2563eb" radius={[4, 4, 0, 0]} name="2025년 매출 (만원)" />
            <Bar yAxisId="left" dataKey="작년" fill="#94a3b8" radius={[4, 4, 0, 0]} name="2024년 매출 (만원)" />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="신장률" 
              stroke="#f97316" 
              strokeWidth={2} 
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const isNegative = payload.신장률 < 0;
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={4} 
                    fill={isNegative ? '#ef4444' : '#f97316'} 
                  />
                );
              }}
              name="신장률 (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlySalesTrend;

