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
import competitorDataV2Json from '../competitor_data_v2.json';

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

interface CompetitorStoreData {
  백화점: string;
  브랜드별_월평균: { [brandName: string]: number };
}

interface BrandRankingItem {
  백화점: string;
  월평균: number;
  순위: number;
}

interface CompetitorDataV2Json {
  brands: string[];
  stores: CompetitorStoreData[];
  total_stores: number;
  brand_rankings?: { [brandName: string]: BrandRankingItem[] };
}

interface ReportPageProps {
  selectedStoreName?: string;
}

const ReportPage: React.FC<ReportPageProps> = ({ selectedStoreName }) => {
  const data = itemSeasonDataJson as ItemSeasonDataJson;
  const inventoryData = storeInventoryDataJson as StoreInventoryDataJson;
  const competitorData = competitorDataV2Json as CompetitorDataV2Json;
  const [selectedMonth, setSelectedMonth] = useState<string>('전체');
  const [isInventoryExpanded, setIsInventoryExpanded] = useState<boolean>(false);
  
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

  // 브랜드별 순위 데이터 (중복 제거된 브랜드 목록)
  const uniqueBrands = useMemo(() => {
    if (!competitorData || !competitorData.brands) return [];
    // 중복 제거
    return Array.from(new Set(competitorData.brands));
  }, [competitorData]);

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

    const seasonData = Object.entries(seasonMap)
      .map(([시즌, values]) => ({
        시즌,
        재고수량: values.재고수량,
        재고금액: Math.round(values.재고금액 / 10000) // 만원 단위
      }))
      .filter(item => item.재고금액 > 0); // 재고금액이 0만원인 항목 제외

    // 평균 재고금액 계산
    const avgInventory = seasonData.length > 0
      ? seasonData.reduce((sum, item) => sum + item.재고금액, 0) / seasonData.length
      : 0;

    // 재고가 적은 시즌 식별 (평균의 50% 미만)
    const lowInventoryThreshold = avgInventory * 0.5;
    
    return seasonData
      .map(item => ({
        ...item,
        isLowInventory: item.재고금액 < lowInventoryThreshold
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

      {/* 점포별 브랜드 순위표 */}
      {competitorData.stores && competitorData.stores.length > 0 && (() => {
        // 선택된 매장이 있으면 해당 매장만 필터링, 없으면 전체 표시
        const filteredStores = selectedStoreName
          ? competitorData.stores.filter((store) => {
              const storeName = store.백화점 || '';
              // 정확한 매칭 또는 포함 관계 확인
              return storeName === selectedStoreName || 
                     storeName.includes(selectedStoreName) || 
                     selectedStoreName.includes(storeName);
            })
          : competitorData.stores;

        if (filteredStores.length === 0) {
          return (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                점포별 브랜드 순위 (월평균 1~12월 기준)
              </h3>
              <p className="text-xs text-slate-500 text-center py-8">
                선택된 매장의 경쟁사 데이터가 없습니다.
              </p>
            </div>
          );
        }

        return (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
              점포별 브랜드 순위 (월평균 1~11월 기준)
              {selectedStoreName && (
                <span className="text-xs text-slate-500 font-normal ml-2">
                  ({selectedStoreName} 매장)
                </span>
              )}
            </h3>
            <div className="space-y-4 max-h-[800px] overflow-y-auto">
              {filteredStores.map((store) => {
              const isSelectedStore = selectedStoreName && 
                (store.백화점.includes(selectedStoreName) || 
                 selectedStoreName.includes(store.백화점));
              
              // 해당 점포의 브랜드별 데이터를 순위대로 정렬
              const brandRankings = Object.entries(store.브랜드별_월평균)
                .filter(([_, value]) => value > 0) // 0보다 큰 값만
                .map(([brandName, monthlyAvg]) => ({
                  브랜드: brandName,
                  월평균: monthlyAvg,
                  순위: 0 // 나중에 할당
                }))
                .sort((a, b) => b.월평균 - a.월평균); // 월평균 내림차순 정렬
              
              // 순위 할당
              brandRankings.forEach((item, idx) => {
                item.순위 = idx + 1;
              });

              if (brandRankings.length === 0) return null;

              return (
                <div
                  key={store.백화점}
                  className={`border rounded-xl overflow-hidden ${
                    isSelectedStore
                      ? 'border-blue-300 bg-blue-50/30'
                      : 'border-slate-200'
                  }`}
                >
                  <div className={`px-4 py-3 border-b ${isSelectedStore ? 'bg-blue-100 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className={`text-sm font-bold ${isSelectedStore ? 'text-blue-900' : 'text-slate-900'}`}>
                      {store.백화점}
                      {isSelectedStore && <span className="ml-2 text-xs text-blue-600">(선택된 매장)</span>}
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">
                            순위
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">
                            브랜드
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 border-b border-slate-200">
                            월평균 (천원)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {brandRankings.map((item) => {
                          const isMLB = item.브랜드 === 'MLB';
                          return (
                            <tr
                              key={`${store.백화점}-${item.브랜드}`}
                              className={`border-b transition-colors ${
                                isMLB
                                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                  : 'border-slate-100 hover:bg-slate-50'
                              }`}
                            >
                              <td className="px-4 py-2">
                                <div
                                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                    isMLB
                                      ? 'bg-blue-600 text-white'
                                      : item.순위 <= 3
                                      ? 'bg-purple-100 text-purple-600'
                                      : item.순위 <= 5
                                      ? 'bg-purple-50 text-purple-500'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {item.순위}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`text-xs font-semibold ${isMLB ? 'text-blue-700 font-bold' : 'text-slate-900'}`}>
                                  {item.브랜드}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <span className={`text-xs font-bold ${isMLB ? 'text-blue-700' : 'text-slate-900'}`}>
                                  {Math.round(item.월평균).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        );
      })()}

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

      {/* 시즌별 재고 상세 정보 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <button
          onClick={() => setIsInventoryExpanded(!isInventoryExpanded)}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
            시즌별 재고 상세 정보 <span className="text-xs text-slate-500 font-normal">(11월 기준)</span>
          </h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-slate-400 transition-transform ${isInventoryExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isInventoryExpanded && (
          <div className="space-y-3">
            {seasonInventoryData.length > 0 ? (
              <>
                {/* 재고가 적은 시즌 경고 */}
                {seasonInventoryData.filter(s => s.isLowInventory).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs font-bold text-red-700">재고 부족 시즌</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {seasonInventoryData
                        .filter(s => s.isLowInventory)
                        .map((season) => (
                          <span key={season.시즌} className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                            {season.시즌} ({season.재고금액.toLocaleString()}만원)
                          </span>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* 시즌별 재고 목록 */}
                {seasonInventoryData.map((season, idx) => (
                  <div 
                    key={season.시즌} 
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      season.isLowInventory 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        season.isLowInventory
                          ? 'bg-red-100 text-red-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{season.시즌}</p>
                          {season.isLowInventory && (
                            <span className="px-1.5 py-0.5 bg-red-200 text-red-700 rounded text-[10px] font-bold">
                              부족
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">{season.재고수량.toLocaleString()}개</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${season.isLowInventory ? 'text-red-700' : 'text-slate-900'}`}>
                        {season.재고금액.toLocaleString()}만원
                      </p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">재고 데이터가 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;

