import React, { useMemo, useState, useEffect } from 'react';
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
import { dataService } from '../services/dataService';

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
  총매출?: number;
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
  data: ItemSeasonDataJson | null;
  inventoryData: StoreInventoryDataJson | null;
  competitorData: CompetitorDataV2Json | null;
  currentYear?: number;
}

const ReportPage: React.FC<ReportPageProps> = ({
  selectedStoreName,
  data,
  inventoryData,
  competitorData,
  currentYear = 2026
}) => {
  // 선택한 매장의 데이터만 필터링
  const storeData = useMemo(() => {
    if (!data || !selectedStoreName) {
      return data?.data || [];
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

  if (!data || !inventoryData || !competitorData) {
    return (
      <div className="flex flex-col h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 text-sm font-medium">리포트 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  // 시즌별 데이터 집계 (연간 합산, 정상 판매액만, 전년 대비)
  const seasonData = useMemo(() => {
    const seasonMap: { [key: string]: { 올해정상판매액: number; 작년정상판매액: number; 판매수량: number } } = {};

    storeData.forEach((item) => {
      const season = item.시즌 || '기타';
      if (!seasonMap[season]) {
        seasonMap[season] = { 올해정상판매액: 0, 작년정상판매액: 0, 판매수량: 0 };
      }
      // 연간 합산 (1~12월)
      for (let month = 1; month <= 12; month++) {
        const currentYearKey = `${currentYear}${String(month).padStart(2, '0')}`;
        const lastYearKey = `${currentYear - 1}${String(month).padStart(2, '0')}`;
        seasonMap[season].올해정상판매액 += item[currentYearKey] || 0;
        seasonMap[season].작년정상판매액 += item[lastYearKey] || 0;
      }
      if (item.정상_판매택가 > 0 && item.정상_판매수량 > 0) {
        const avgPrice = item.정상_판매택가 / item.정상_판매수량;
        let totalRevenue = 0;
        for (let month = 1; month <= 12; month++) {
          const currentYearKey = `${currentYear}${String(month).padStart(2, '0')}`;
          totalRevenue += item[currentYearKey] || 0;
        }
        seasonMap[season].판매수량 += Math.round(totalRevenue / avgPrice);
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
  }, [storeData, currentYear]);


  // 브랜드별 순위 데이터 (중복 제거된 브랜드 목록)
  const uniqueBrands = useMemo(() => {
    if (!competitorData || !competitorData.brands) return [];
    // 중복 제거
    return Array.from(new Set(competitorData.brands));
  }, [competitorData]);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const 올해값 = payload.find((p: any) => p.dataKey === '올해')?.value || 0;
      const 작년값 = payload.find((p: any) => p.dataKey === '작년')?.value || 0;
      const 성장률 = 작년값 > 0 ? ((올해값 - 작년값) / 작년값 * 100).toFixed(1) : '0';

      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 text-xs min-w-[180px]">
          <p className="font-bold text-slate-900 mb-3 text-sm border-b border-slate-100 pb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-slate-600">{entry.name.split('(')[0].trim()}</span>
                </div>
                <span className="font-bold text-slate-900">{entry.value.toLocaleString()}만원</span>
              </div>
            ))}
            {올해값 > 0 && 작년값 > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">전년 대비</span>
                  <span className={`font-bold ${parseFloat(성장률) >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                    {parseFloat(성장률) >= 0 ? '+' : ''}{성장률}%
                  </span>
                </div>
              </div>
            )}
          </div>
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
              점포별 브랜드 순위 (월평균 1~12월 기준)
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
                  .filter(([_, value]) => Number(value) > 0) // 0보다 큰 값만
                  .map(([brandName, monthlyAvg]) => ({
                    브랜드: brandName,
                    월평균: Number(monthlyAvg),
                    순위: 0 // 나중에 할당
                  }))
                  .sort((a, b) => Number(b.월평균) - Number(a.월평균)); // 월평균 내림차순 정렬

                // 순위 할당
                brandRankings.forEach((item, idx) => {
                  item.순위 = idx + 1;
                });

                if (brandRankings.length === 0) return null;

                return (
                  <div
                    key={store.백화점}
                    className={`border rounded-xl overflow-hidden ${isSelectedStore
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
                          {/* 총매출 표시 (데이터가 있는 경우) */}
                          {store.총매출 !== undefined && store.총매출 > 0 && (
                            <tr className="bg-slate-100 border-b border-slate-200">
                              <td className="px-4 py-2 text-xs font-bold text-slate-500">
                                -
                              </td>
                              <td className="px-4 py-2">
                                <span className="text-xs font-bold text-slate-700">전체 매출 (점 합계)</span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <span className="text-xs font-bold text-slate-900">
                                  {Math.round(store.총매출).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          )}
                          {brandRankings.map((item) => {
                            const isMLB = item.브랜드 === 'MLB';
                            return (
                              <tr
                                key={`${store.백화점}-${item.브랜드}`}
                                className={`border-b transition-colors ${isMLB
                                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                  : 'border-slate-100 hover:bg-slate-50'
                                  }`}
                              >
                                <td className="px-4 py-2">
                                  <div
                                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isMLB
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


    </div>
  );
};

export default ReportPage;

