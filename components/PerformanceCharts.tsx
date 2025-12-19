
import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { MonthlyPerformance, ItemPerformance } from '../types';

interface PerformanceChartsProps {
  monthly: MonthlyPerformance[];
  items: ItemPerformance[];
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ monthly, items }) => {
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

      {/* Top Items */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
            아이템별 판매 성장률
        </h3>
        <div className="space-y-4">
            {items.sort((a,b) => b.sales - a.sales).slice(0, 5).map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400">
                        0{idx + 1}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">{item.sales.toLocaleString()}건</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${item.growth >= 0 ? 'bg-orange-400' : 'bg-slate-300'}`}
                                style={{ width: `${Math.min(Math.max(item.growth + 30, 10), 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className={`text-[10px] font-bold ${item.growth >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {item.growth >= 0 ? '+' : ''}{item.growth}%
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;
