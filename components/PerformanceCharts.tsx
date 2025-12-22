
import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell
} from 'recharts';
import { MonthlyPerformance } from '../types';

interface PerformanceChartsProps {
  monthly: MonthlyPerformance[];
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ monthly }) => {
  return (
    <div className="space-y-6 mb-6">
      {/* Monthly Chart - 전년 대비 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
            월별 매출 전년 대비
        </h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any, name: string, props: any) => {
                  if (name === 'revenue') {
                    const growthRate = props.payload.growthRate || 0;
                    return [
                      `${value.toLocaleString()}만원 (전년: ${props.payload.target.toLocaleString()}만원)`,
                      '당월'
                    ];
                  }
                  return [value, name];
                }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={16}>
                {monthly.map((entry, index) => {
                  const growthRate = entry.growthRate || 0;
                  const isPositive = growthRate >= 0;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isPositive ? '#2563eb' : '#ef4444'} 
                      fillOpacity={index === monthly.length - 1 ? 1 : 0.6}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div> 전년 대비 증가
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> 전년 대비 감소
            </div>
        </div>
      </div>

    </div>
  );
};

export default PerformanceCharts;





