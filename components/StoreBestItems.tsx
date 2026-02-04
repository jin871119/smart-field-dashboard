import React, { useMemo, useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface StoreStyleSalesData {
  매장코드: string;
  매장명: string;
  품번: string;
  제품명: string;
  판매액합계: number;
  판매수량합계: number;
  [key: string]: any;
}

interface StoreStyleSalesDataJson {
  headers: string[];
  data: StoreStyleSalesData[];
  total_rows: number;
}

interface StoreBestItemsProps {
  selectedStoreName: string;
  data: StoreStyleSalesDataJson | null;
}

const StoreBestItems: React.FC<StoreBestItemsProps> = ({ selectedStoreName, data }) => {
  // useEffect removed as data is passed as prop


  // 선택한 매장의 BEST 5 아이템 계산 (품번과 제품명 기준)
  const bestItems = useMemo(() => {
    if (!selectedStoreName || !data) {
      return [];
    }

    // 매장명 매칭 (괄호 안의 이름도 고려)
    const storeItems = data.data.filter((item: StoreStyleSalesData) => {
      const storeName = item.매장명 || '';
      // 괄호 안의 이름 추출
      const match = storeName.match(/\(([^)]+)\)/);
      if (match) {
        const nameInBracket = match[1];
        return nameInBracket === selectedStoreName || storeName.includes(selectedStoreName);
      }
      return storeName.includes(selectedStoreName) || selectedStoreName.includes(storeName);
    });

    if (storeItems.length === 0) {
      return [];
    }

    // 품번별로 집계 (판매금액 합계)
    const itemMap: { [key: string]: { 품번: string; 제품명: string; 판매수량: number; 판매금액: number } } = {};

    storeItems.forEach((item: StoreStyleSalesData) => {
      const 품번 = item.품번 || '기타';
      const 제품명 = item.제품명 || 품번;
      const 판매수량 = item.판매수량합계 || 0;
      const 판매금액 = item.판매액합계 || 0;

      if (!itemMap[품번]) {
        itemMap[품번] = { 품번, 제품명, 판매수량: 0, 판매금액: 0 };
      }

      itemMap[품번].판매수량 += 판매수량;
      itemMap[품번].판매금액 += 판매금액;
    });

    // 판매금액 기준으로 정렬하고 상위 5개 선택
    return Object.values(itemMap)
      .sort((a, b) => b.판매금액 - a.판매금액)
      .slice(0, 5)
      .map((item, index) => ({
        순위: index + 1,
        품번: item.품번,
        제품명: item.제품명,
        판매수량: item.판매수량,
        판매금액: item.판매금액
      }));
  }, [data, selectedStoreName]);

  if (bestItems.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
          매장별 BEST 5 아이템 <span className="text-xs text-slate-500 font-normal">(1월 기준)</span>
        </h3>
        <p className="text-xs text-slate-500 text-center py-8">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
        매장별 BEST 5 아이템 <span className="text-xs text-slate-500 font-normal">(1월 기준)</span>
      </h3>

      {/* 테이블 헤더 */}
      <div className="grid grid-cols-4 gap-4 pb-3 border-b border-slate-200 mb-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">순위</div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">품번</div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">판매수량</div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">판매금액</div>
      </div>

      {/* 테이블 데이터 */}
      <div className="space-y-2">
        {bestItems.map((item) => (
          <div
            key={item.품번}
            className="grid grid-cols-4 gap-4 py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${item.순위 === 1
                  ? 'bg-yellow-100 text-yellow-700'
                  : item.순위 === 2
                    ? 'bg-slate-100 text-slate-600'
                    : item.순위 === 3
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-slate-50 text-slate-500'
                  }`}
              >
                {item.순위}
              </div>
            </div>
            <div className="flex items-center">
              <div>
                <span className="text-sm font-semibold text-slate-900">{item.품번}</span>
                {item.제품명 && item.제품명 !== item.품번 && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.제품명}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-sm font-medium text-slate-700">{item.판매수량.toLocaleString()}개</span>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-sm font-bold text-slate-900">
                {Math.round(item.판매금액 / 10000).toLocaleString()}만원
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreBestItems;

