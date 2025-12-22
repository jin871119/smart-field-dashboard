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
import itemSeasonDataJson from '../item_season_data.json';

interface ItemSeasonData {
  매장코드: string;
  매장명: string;
  ITEM: string;
  시즌: string;
  [key: string]: any; // 월별 데이터 (202501, 202502 등)
}

interface ItemSeasonDataJson {
  headers: string[];
  data: ItemSeasonData[];
  total_rows: number;
}

interface MonthlySalesTrendProps {
  selectedStoreName: string;
}

const MonthlySalesTrend: React.FC<MonthlySalesTrendProps> = ({ selectedStoreName }) => {
  const data = itemSeasonDataJson as ItemSeasonDataJson;

  // 선택한 매장의 데이터만 필터링
  const storeData = useMemo(() => {
    if (!selectedStoreName) {
      return [];
    }
    // 매장명 매칭 (괄호 안의 이름도 고려)
    return data.data.filter((item) => {
      const storeName = item.매장명 || '';
      // 괄호 안의 이름 추출
      const match = storeName.match(/\(([^)]+)\)/);
      if (match) {
        const nameInBracket = match[1];
        return nameInBracket === selectedStoreName || storeName.includes(selectedStoreName);
      }
      return storeName.includes(selectedStoreName) || selectedStoreName.includes(storeName);
    });
  }, [data, selectedStoreName]);

  // 월별 판매액 추이 (2024년과 2025년 비교)
  const monthlyData = useMemo(() => {
    const monthlyMap: { [key: string]: { current: number; lastYear: number } } = {};

    storeData.forEach((item) => {
      // 2025년 데이터 (202501 ~ 202512)
      for (let month = 1; month <= 12; month++) {
        const monthKey = `2025${String(month).padStart(2, '0')}`;
        const value = item[monthKey] || 0;
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { current: 0, lastYear: 0 };
        }
        monthlyMap[monthKey].current += value || 0;
      }

      // 2024년 데이터 (202401 ~ 202412)
      for (let month = 1; month <= 12; month++) {
        const monthKey = `2024${String(month).padStart(2, '0')}`;
        const value = item[monthKey] || 0;
        const currentMonthKey = `2025${String(month).padStart(2, '0')}`;
        if (!monthlyMap[currentMonthKey]) {
          monthlyMap[currentMonthKey] = { current: 0, lastYear: 0 };
        }
        monthlyMap[currentMonthKey].lastYear += value || 0;
      }
    });

    return Object.entries(monthlyMap)
      .map(([monthKey, values]) => {
        const month = parseInt(monthKey.substring(4, 6));
        const 올해 = Math.round(values.current / 10000);
        const 작년 = Math.round(values.lastYear / 10000);
        const 신장률 = 작년 > 0 ? ((올해 - 작년) / 작년) * 100 : 0;
        return {
          월: `${month}월`,
          올해,
          작년,
          신장률: Math.round(신장률 * 10) / 10
        };
      })
      .sort((a, b) => {
        const monthA = parseInt(a.월);
        const monthB = parseInt(b.월);
        return monthA - monthB;
      });
  }, [storeData]);

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
              dot={{ r: 4, fill: '#f97316' }}
              name="신장률 (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlySalesTrend;

