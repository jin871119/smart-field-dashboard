import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
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
        return {
          월: `${month}월`,
          올해: Math.round(values.current / 10000),
          작년: Math.round(values.lastYear / 10000)
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
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-slate-700">
              {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}만원</span>
            </p>
          ))}
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
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="월" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="올해" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="2025년 (만원)" />
            <Line type="monotone" dataKey="작년" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} name="2024년 (만원)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlySalesTrend;

