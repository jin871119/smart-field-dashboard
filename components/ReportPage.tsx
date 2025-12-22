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
  CartesianGrid
} from 'recharts';
import itemSeasonDataJson from '../item_season_data.json';
import storeInventoryDataJson from '../store_inventory_data.json';

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

interface StoreInventoryData {
  시즌: string;
  매장코드: string;
  매장명: string;
  매장재고수량: number;
  매장재고택가: number;
}

interface StoreInventoryDataJson {
  headers: string[];
  data: StoreInventoryData[];
  total_rows: number;
}

interface ReportPageProps {
  selectedStoreName?: string;
}

const ReportPage: React.FC<ReportPageProps> = ({ selectedStoreName }) => {
  const data = itemSeasonDataJson as ItemSeasonDataJson;
  const inventoryData = storeInventoryDataJson as StoreInventoryDataJson;
  const [selectedMonth, setSelectedMonth] = useState<string>('전체');
  
  // 선택한 매장의 데이터만 필터링
  const storeData = useMemo(() => {
    if (!selectedStoreName) {
      return data.data;
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
    let baseData = storeData;
    
    if (selectedMonth !== '전체') {
      const monthNum = parseInt(selectedMonth.replace('월', ''));
      const currentYearKey = `2025${String(monthNum).padStart(2, '0')}`;
      const lastYearKey = `2024${String(monthNum).padStart(2, '0')}`;
      
      baseData = storeData.filter((item) => {
        const currentValue = item[currentYearKey] || 0;
        const lastValue = item[lastYearKey] || 0;
        return currentValue > 0 || lastValue > 0;
      });
    }
    
    return baseData;
  }, [storeData, selectedMonth]);

  // 시즌별 데이터 집계 (월별 필터 적용, 정상 판매액만, 전년 대비)
  const seasonData = useMemo(() => {
    const seasonMap: { [key: string]: { 올해정상판매액: number; 작년정상판매액: number; 판매수량: number } } = {};

    filteredData.forEach((item) => {
      const season = item.시즌 || '기타';
      if (!seasonMap[season]) {
        seasonMap[season] = { 올해정상판매액: 0, 작년정상판매액: 0, 판매수량: 0 };
      }
      
      if (selectedMonth === '전체') {
        // 전체 선택 시: 정상 판매액만 사용
        seasonMap[season].올해정상판매액 += item.정상_판매액 || 0;
        // 작년 데이터는 월별 데이터에서 집계 (2024년 데이터)
        for (let month = 1; month <= 12; month++) {
          const lastYearKey = `2024${String(month).padStart(2, '0')}`;
          seasonMap[season].작년정상판매액 += item[lastYearKey] || 0;
        }
        seasonMap[season].판매수량 += item.정상_판매수량 || 0;
      } else {
        // 특정 월 선택 시: 해당 월의 데이터만 사용
        const monthNum = parseInt(selectedMonth.replace('월', ''));
        const currentYearKey = `2025${String(monthNum).padStart(2, '0')}`;
        const lastYearKey = `2024${String(monthNum).padStart(2, '0')}`;
        
        // 올해 정상 판매액 (2025년 해당 월)
        seasonMap[season].올해정상판매액 += item[currentYearKey] || 0;
        // 작년 정상 판매액 (2024년 해당 월)
        seasonMap[season].작년정상판매액 += item[lastYearKey] || 0;
        // 판매수량은 정확히 계산하기 어려우므로 판매액 기반으로 추정
        if (item.정상_판매택가 > 0 && item.정상_판매수량 > 0) {
          const avgPrice = item.정상_판매택가 / item.정상_판매수량;
          seasonMap[season].판매수량 += Math.round((item[currentYearKey] || 0) / avgPrice);
        }
      }
    });

    return Object.entries(seasonMap)
      .map(([시즌, values]) => ({
        시즌,
        올해: Math.round(values.올해정상판매액 / 10000), // 만원 단위
        작년: Math.round(values.작년정상판매액 / 10000),
        판매수량: values.판매수량,
        성장률: values.작년정상판매액 > 0
          ? ((values.올해정상판매액 - values.작년정상판매액) / values.작년정상판매액) * 100
          : 0
      }))
      .sort((a, b) => b.올해 - a.올해);
  }, [filteredData, selectedMonth]);

  // ITEM별 데이터 집계 (월별 필터 적용, 정상 판매액만, 전년 대비)
  const itemData = useMemo(() => {
    const itemMap: { [key: string]: { 올해정상판매액: number; 작년정상판매액: number; 판매수량: number } } = {};

    filteredData.forEach((item) => {
      const itemCode = item.ITEM || '기타';
      if (!itemMap[itemCode]) {
        itemMap[itemCode] = { 올해정상판매액: 0, 작년정상판매액: 0, 판매수량: 0 };
      }
      
      if (selectedMonth === '전체') {
        // 전체 선택 시: 정상 판매액만 사용
        itemMap[itemCode].올해정상판매액 += item.정상_판매액 || 0;
        // 작년 데이터는 월별 데이터에서 집계 (2024년 데이터)
        for (let month = 1; month <= 12; month++) {
          const lastYearKey = `2024${String(month).padStart(2, '0')}`;
          itemMap[itemCode].작년정상판매액 += item[lastYearKey] || 0;
        }
        itemMap[itemCode].판매수량 += item.정상_판매수량 || 0;
      } else {
        // 특정 월 선택 시: 해당 월의 데이터만 사용
        const monthNum = parseInt(selectedMonth.replace('월', ''));
        const currentYearKey = `2025${String(monthNum).padStart(2, '0')}`;
        const lastYearKey = `2024${String(monthNum).padStart(2, '0')}`;
        
        // 올해 정상 판매액 (2025년 해당 월)
        itemMap[itemCode].올해정상판매액 += item[currentYearKey] || 0;
        // 작년 정상 판매액 (2024년 해당 월)
        itemMap[itemCode].작년정상판매액 += item[lastYearKey] || 0;
        // 판매수량은 정확히 계산하기 어려우므로 판매액 기반으로 추정
        if (item.정상_판매택가 > 0 && item.정상_판매수량 > 0) {
          const avgPrice = item.정상_판매택가 / item.정상_판매수량;
          itemMap[itemCode].판매수량 += Math.round((item[currentYearKey] || 0) / avgPrice);
        }
      }
    });

    return Object.entries(itemMap)
      .map(([ITEM, values]) => ({
        ITEM,
        올해: Math.round(values.올해정상판매액 / 10000),
        작년: Math.round(values.작년정상판매액 / 10000),
        판매수량: values.판매수량,
        성장률: values.작년정상판매액 > 0
          ? ((values.올해정상판매액 - values.작년정상판매액) / values.작년정상판매액) * 100
          : 0
      }))
      .sort((a, b) => b.올해 - a.올해);
  }, [filteredData, selectedMonth]);

  // 시즌별 재고 데이터 집계
  const seasonInventoryData = useMemo(() => {
    if (!selectedStoreName) {
      return [];
    }

    // 선택한 매장의 재고 데이터만 필터링
    const storeInventory = inventoryData.data.filter((item) => {
      const storeName = item.매장명 || '';
      // 괄호 안의 이름 추출
      const match = storeName.match(/\(([^)]+)\)/);
      if (match) {
        const nameInBracket = match[1];
        return nameInBracket === selectedStoreName || storeName.includes(selectedStoreName);
      }
      return storeName.includes(selectedStoreName) || selectedStoreName.includes(storeName);
    });

    // 시즌별로 집계
    const seasonMap: { [key: string]: { 재고수량: number; 재고금액: number } } = {};

    storeInventory.forEach((item) => {
      const season = item.시즌 || '기타';
      if (!seasonMap[season]) {
        seasonMap[season] = { 재고수량: 0, 재고금액: 0 };
      }
      seasonMap[season].재고수량 += item.매장재고수량 || 0;
      seasonMap[season].재고금액 += item.매장재고택가 || 0;
    });

    return Object.entries(seasonMap)
      .map(([시즌, values]) => ({
        시즌,
        재고수량: values.재고수량,
        재고금액: Math.round(values.재고금액 / 10000) // 만원 단위
      }))
      .sort((a, b) => b.재고금액 - a.재고금액);
  }, [inventoryData, selectedStoreName]);

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
      {/* 선택된 매장 표시 */}
      {selectedStoreName && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-4 border border-blue-100">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="text-xs text-blue-600 font-semibold">선택된 매장</p>
              <p className="text-sm font-bold text-slate-900">{selectedStoreName}</p>
            </div>
          </div>
        </div>
      )}

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
              <Bar dataKey="올해" fill="#f97316" radius={[4, 4, 0, 0]} name="2025년 정상 판매액 (만원)" />
              <Bar dataKey="작년" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="2024년 정상 판매액 (만원)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 시즌별 재고 현황 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
          시즌별 재고 현황
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonInventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="시즌" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#10b981' }} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-md border border-slate-100 text-xs">
                        <p className="font-bold text-slate-900 mb-1">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <p key={index} className="text-slate-700">
                            {entry.name}: <span className="font-semibold">
                              {entry.dataKey === '재고금액' 
                                ? `${entry.value.toLocaleString()}만원`
                                : `${entry.value.toLocaleString()}개`}
                            </span>
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar yAxisId="right" dataKey="재고수량" fill="#10b981" radius={[4, 4, 0, 0]} name="재고수량 (개)" />
              <Bar yAxisId="left" dataKey="재고금액" fill="#3b82f6" radius={[4, 4, 0, 0]} name="재고금액 (만원)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 시즌별 재고 상세 정보 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
          시즌별 재고 상세 정보
        </h3>
        <div className="space-y-3">
          {seasonInventoryData.length > 0 ? (
            seasonInventoryData.map((season, idx) => (
              <div key={season.시즌} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{season.시즌}</p>
                    <p className="text-[10px] text-slate-500">{season.재고수량.toLocaleString()}개</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{season.재고금액.toLocaleString()}만원</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">재고 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;

