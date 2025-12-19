import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import itemSeasonDataJson from '../item_season_data.json';

interface ItemSeasonData {
  매장코드: string;
  매장명: string;
  ITEM: string;
  시즌: string;
  판매수량: number;
  판매액: number;
  판매택가: number;
  정상_판매수량: number;
  정상_판매액: number;
  정상_판매택가: number;
  반품_판매수량: number;
  반품_판매액: number;
  반품_판매택가: number;
  [key: string]: any; // 월별 데이터 (202501, 202502 등)
}

interface ItemSeasonDataJson {
  headers: string[];
  data: ItemSeasonData[];
  total_rows: number;
}

const ReportPage: React.FC = () => {
  const data = itemSeasonDataJson as ItemSeasonDataJson;
  const [selectedMonth, setSelectedMonth] = useState<string>('전체');
  
  // 월별 필터 옵션 생성
  const monthOptions = useMemo(() => {
    const months = ['전체'];
    for (let month = 1; month <= 12; month++) {
      months.push(`${month}월`);
    }
    return months;
  }, []);
  
  // 선택된 월에 해당하는 데이터 필터링
  const filteredData = useMemo(() => {
    if (selectedMonth === '전체') {
      return data.data;
    }
    
    const monthNum = parseInt(selectedMonth.replace('월', ''));
    const currentYearKey = `2025${String(monthNum).padStart(2, '0')}`;
    const lastYearKey = `2024${String(monthNum).padStart(2, '0')}`;
    
    return data.data.filter((item) => {
      const currentValue = item[currentYearKey] || 0;
      const lastValue = item[lastYearKey] || 0;
      return currentValue > 0 || lastValue > 0;
    });
  }, [data, selectedMonth]);

  // 시즌별 데이터 집계
  const seasonData = useMemo(() => {
    const seasonMap: { [key: string]: { 판매액: number; 정상_판매액: number; 판매수량: number } } = {};

    filteredData.forEach((item) => {
      const season = item.시즌 || '기타';
      if (!seasonMap[season]) {
        seasonMap[season] = { 판매액: 0, 정상_판매액: 0, 판매수량: 0 };
      }
      seasonMap[season].판매액 += item.판매액 || 0;
      seasonMap[season].정상_판매액 += item.정상_판매액 || 0;
      seasonMap[season].판매수량 += item.판매수량 || 0;
    });

    return Object.entries(seasonMap)
      .map(([시즌, values]) => ({
        시즌,
        판매액: Math.round(values.판매액 / 10000), // 만원 단위
        정상_판매액: Math.round(values.정상_판매액 / 10000),
        판매수량: values.판매수량,
        성장률: values.정상_판매액 > 0
          ? ((values.판매액 - values.정상_판매액) / values.정상_판매액) * 100
          : 0
      }))
      .sort((a, b) => b.판매액 - a.판매액);
  }, [filteredData]);

  // ITEM별 데이터 집계
  const itemData = useMemo(() => {
    const itemMap: { [key: string]: { 판매액: number; 정상_판매액: number; 판매수량: number } } = {};

    filteredData.forEach((item) => {
      const itemCode = item.ITEM || '기타';
      if (!itemMap[itemCode]) {
        itemMap[itemCode] = { 판매액: 0, 정상_판매액: 0, 판매수량: 0 };
      }
      itemMap[itemCode].판매액 += item.판매액 || 0;
      itemMap[itemCode].정상_판매액 += item.정상_판매액 || 0;
      itemMap[itemCode].판매수량 += item.판매수량 || 0;
    });

    return Object.entries(itemMap)
      .map(([ITEM, values]) => ({
        ITEM,
        판매액: Math.round(values.판매액 / 10000),
        정상_판매액: Math.round(values.정상_판매액 / 10000),
        판매수량: values.판매수량,
        성장률: values.정상_판매액 > 0
          ? ((values.판매액 - values.정상_판매액) / values.정상_판매액) * 100
          : 0
      }))
      .sort((a, b) => b.판매액 - a.판매액);
  }, [filteredData]);

  // 월별 판매액 추이 (2024년과 2025년 비교)
  const monthlyData = useMemo(() => {
    const monthlyMap: { [key: string]: { current: number; lastYear: number } } = {};

    filteredData.forEach((item) => {
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
  }, [filteredData]);

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
    <div className="space-y-6">
      {/* 월별 필터 */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">월별 필터</h3>
          <span className="text-xs text-slate-500">{filteredData.length}개 데이터</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {monthOptions.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedMonth === month
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* 시즌별 판매 현황 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
          시즌별 판매 현황
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="시즌" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="판매액" fill="#2563eb" radius={[4, 4, 0, 0]} name="총 판매액 (만원)" />
              <Bar dataKey="정상_판매액" fill="#94a3b8" radius={[4, 4, 0, 0]} name="정상 판매액 (만원)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ITEM별 판매 현황 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
          ITEM별 판매 현황
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={itemData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="ITEM" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="판매액" fill="#f97316" radius={[4, 4, 0, 0]} name="총 판매액 (만원)" />
              <Bar dataKey="정상_판매액" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="정상 판매액 (만원)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 월별 판매 추이 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
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

      {/* 시즌별 상세 정보 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
          시즌별 상세 정보
        </h3>
        <div className="space-y-3">
          {seasonData.slice(0, 10).map((season, idx) => (
            <div key={season.시즌} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{season.시즌}</p>
                  <p className="text-[10px] text-slate-500">{season.판매수량}건</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{season.판매액.toLocaleString()}만원</p>
                <p className={`text-[10px] font-bold ${season.성장률 >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {season.성장률 >= 0 ? '+' : ''}{season.성장률.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;

