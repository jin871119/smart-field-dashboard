import React, { useState, useMemo } from 'react';
import { StoreData } from '../types';
import { filterByStoreName, matchStoreName } from '../utils/storeNameMatcher';

interface Props {
  stores: StoreData[];
  itemSeasonData: any;
  inventoryData: any;
  currentYear: number;
}

const StoreComparison: React.FC<Props> = ({ stores, itemSeasonData, inventoryData, currentYear }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  const filteredStores = useMemo(() => {
    if (!searchText) return stores;
    return stores.filter(s => s.store.name.includes(searchText));
  }, [stores, searchText]);

  const selectedStores = useMemo(() => {
    return selectedIds.map(id => stores.find(s => s.store.id === id)).filter(Boolean) as StoreData[];
  }, [selectedIds, stores]);

  const toggleStore = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // 최대 3개
      return [...prev, id];
    });
  };

  const removeStore = (id: string) => {
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  // 비교 데이터 계산
  const comparisonData = useMemo(() => {
    return selectedStores.map(sd => {
      const perf = sd.monthlyPerformance || [];
      const revenue = sd.yearToDateRevenue || 0;
      const growth = sd.growthRate || 0;
      const activeMonths = sd.activeMonths || 1;
      const monthlyAvg = Math.round(revenue / activeMonths);

      // 재고 데이터
      let totalInventoryQty = 0;
      let totalInventoryValue = 0;
      if (inventoryData?.data) {
        filterByStoreName(inventoryData.data, sd.store.name, (d: any) => d.매장명 || '')
          .forEach((d: any) => {
            totalInventoryQty += d.매장재고수량 || 0;
            totalInventoryValue += d.매장재고택가 || 0;
          });
      }

      // 월별 판매 추이 (최근 3개월)
      const recent3 = perf.slice(-3);

      // 베스트 아이템 (itemSeasonData에서)
      let bestItems: { item: string; sales: number }[] = [];
      if (itemSeasonData?.data) {
        const storeItems: { [item: string]: number } = {};
        filterByStoreName(itemSeasonData.data, sd.store.name, (d: any) => d.매장명 || '')
          .forEach((d: any) => {
            const item = d.ITEM;
            if (!storeItems[item]) storeItems[item] = 0;
            for (let month = 1; month <= 12; month++) {
              const key = `${currentYear}${String(month).padStart(2, '0')}`;
              storeItems[item] += d[key] || 0;
            }
          });

        bestItems = Object.entries(storeItems)
          .map(([item, sales]) => ({ item, sales }))
          .filter(x => x.sales > 0)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 3);
      }

      return {
        store: sd,
        revenue,
        growth,
        monthlyAvg,
        activeMonths,
        inventoryQty: totalInventoryQty,
        inventoryValue: totalInventoryValue,
        turnover: totalInventoryValue > 0 ? revenue * 10000 / totalInventoryValue : 0,
        recent3,
        bestItems
      };
    });
  }, [selectedStores, inventoryData, itemSeasonData, currentYear]);

  const formatValue = (v: number) => {
    if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
    if (v >= 10000) return `${Math.round(v / 10000).toLocaleString()}만`;
    return v.toLocaleString();
  };

  const storeColors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500'];
  const storeTextColors = ['text-blue-600', 'text-purple-600', 'text-teal-600'];
  const storeBgColors = ['bg-blue-50', 'bg-purple-50', 'bg-teal-50'];
  const storeBorderColors = ['border-blue-200', 'border-purple-200', 'border-teal-200'];

  return (
    <div className="space-y-5">
      {/* 매장 선택 영역 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
          매장 비교 (최대 3개)
        </h3>

        {/* 선택된 매장 태그 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedStores.map((sd, idx) => (
            <span
              key={sd.store.id}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${storeBgColors[idx]} ${storeTextColors[idx]} ${storeBorderColors[idx]} border`}
            >
              <span className={`w-2 h-2 rounded-full ${storeColors[idx]}`}></span>
              {sd.store.name}
              <button
                onClick={() => removeStore(sd.store.id)}
                className="ml-0.5 hover:opacity-70"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))}
          {selectedIds.length < 3 && (
            <button
              onClick={() => setShowSelector(!showSelector)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              매장 추가
            </button>
          )}
        </div>

        {/* 매장 선택 드롭다운 */}
        {showSelector && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="매장명 검색..."
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border-none outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredStores.map(s => {
                const isSelected = selectedIds.includes(s.store.id);
                const isDisabled = !isSelected && selectedIds.length >= 3;
                return (
                  <button
                    key={s.store.id}
                    onClick={() => { toggleStore(s.store.id); if (!isSelected) setShowSelector(false); }}
                    disabled={isDisabled}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors
                      ${isSelected ? 'bg-blue-50 text-blue-700 font-bold' : isDisabled ? 'text-slate-300' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span>{s.store.name}</span>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 비교 결과 */}
      {comparisonData.length >= 2 && (
        <>
          {/* 핵심 지표 비교 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
              핵심 지표 비교
            </h3>

            {/* 연매출 비교 */}
            <div className="mb-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">연매출 (백만원)</p>
              {comparisonData.map((d, idx) => {
                const maxRev = Math.max(...comparisonData.map(x => x.revenue));
                const width = maxRev > 0 ? (d.revenue / maxRev) * 100 : 0;
                return (
                  <div key={d.store.store.id} className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${storeColors[idx]}`}></span>
                        <span className="text-[11px] font-medium text-slate-700">{d.store.store.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-900">
                        {Math.round(d.revenue / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${storeColors[idx]} rounded-full transition-all duration-500`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 신장률 비교 */}
            <div className="mb-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">전년 대비 신장률</p>
              <div className="flex gap-2">
                {comparisonData.map((d, idx) => (
                  <div key={d.store.store.id} className={`flex-1 rounded-xl p-3 text-center ${storeBgColors[idx]} border ${storeBorderColors[idx]}`}>
                    <p className="text-[10px] font-medium text-slate-500 mb-1">{d.store.store.name}</p>
                    <p className={`text-lg font-bold ${d.growth >= 0 ? storeTextColors[idx] : 'text-red-500'}`}>
                      {d.growth >= 0 ? '+' : ''}{d.growth}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 월평균 매출 */}
            <div className="mb-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">월평균 매출 (만원)</p>
              <div className="flex gap-2">
                {comparisonData.map((d, idx) => (
                  <div key={d.store.store.id} className={`flex-1 rounded-xl p-3 text-center bg-slate-50 border border-slate-200`}>
                    <p className="text-[10px] font-medium text-slate-500 mb-1">{d.store.store.name}</p>
                    <p className={`text-sm font-bold ${storeTextColors[idx]}`}>
                      {d.monthlyAvg.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 재고 비교 */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">재고 현황</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-[10px] font-semibold text-slate-500 py-2 pr-2"></th>
                      {comparisonData.map((d, idx) => (
                        <th key={d.store.store.id} className={`text-center text-[10px] font-bold py-2 ${storeTextColors[idx]}`}>
                          {d.store.store.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-[11px]">
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-2 text-slate-500 font-medium">재고수량</td>
                      {comparisonData.map(d => (
                        <td key={d.store.store.id} className="py-2 text-center font-bold text-slate-900">
                          {d.inventoryQty.toLocaleString()}개
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-2 text-slate-500 font-medium">재고택가</td>
                      {comparisonData.map(d => (
                        <td key={d.store.store.id} className="py-2 text-center font-bold text-slate-900">
                          {formatValue(d.inventoryValue)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 pr-2 text-slate-500 font-medium">회전율</td>
                      {comparisonData.map(d => (
                        <td key={d.store.store.id} className={`py-2 text-center font-bold ${d.turnover < 1 ? 'text-red-500' : d.turnover < 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {d.turnover.toFixed(1)}x
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 최근 3개월 추이 비교 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
              최근 월별 매출 비교 (만원)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-[10px] font-semibold text-slate-500 py-2">월</th>
                    {comparisonData.map((d, idx) => (
                      <th key={d.store.store.id} className={`text-right text-[10px] font-bold py-2 ${storeTextColors[idx]}`}>
                        {d.store.store.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {(() => {
                    // 모든 매장의 월 데이터를 합쳐서 표시
                    const allMonths = new Set<string>();
                    comparisonData.forEach(d => d.recent3.forEach(m => allMonths.add(m.month)));
                    const months = Array.from(allMonths);

                    return months.map(month => (
                      <tr key={month} className="border-b border-slate-100">
                        <td className="py-2 text-slate-600 font-medium">{month}</td>
                        {comparisonData.map(d => {
                          const m = d.recent3.find(x => x.month === month);
                          return (
                            <td key={d.store.store.id} className="py-2 text-right font-bold text-slate-900">
                              {m ? m.revenue.toLocaleString() : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* 베스트 아이템 비교 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
              베스트 아이템 비교 (Top 3)
            </h3>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)` }}>
              {comparisonData.map((d, idx) => (
                <div key={d.store.store.id} className={`rounded-xl p-3 border ${storeBorderColors[idx]} ${storeBgColors[idx]}`}>
                  <p className={`text-[10px] font-bold ${storeTextColors[idx]} mb-2`}>{d.store.store.name}</p>
                  {d.bestItems.length > 0 ? (
                    <div className="space-y-1.5">
                      {d.bestItems.map((item, rank) => (
                        <div key={item.item} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${storeColors[idx]} text-white`}>
                              {rank + 1}
                            </span>
                            <span className="text-[11px] font-medium text-slate-700">{item.item}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{formatValue(item.sales)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">데이터 없음</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 매장 정보 비교 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-slate-500 rounded-full"></div>
              매장 정보
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-[10px] font-semibold text-slate-500 py-2"></th>
                    {comparisonData.map((d, idx) => (
                      <th key={d.store.store.id} className={`text-center text-[10px] font-bold py-2 ${storeTextColors[idx]}`}>
                        {d.store.store.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-2 text-slate-500 font-medium">등급</td>
                    {comparisonData.map(d => (
                      <td key={d.store.store.id} className="py-2 text-center font-bold text-slate-900">
                        {d.store.store.등급 || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-2 text-slate-500 font-medium">평수</td>
                    {comparisonData.map(d => (
                      <td key={d.store.store.id} className="py-2 text-center font-bold text-slate-900">
                        {d.store.store.py ? `${d.store.store.py}평` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-2 text-slate-500 font-medium">층수</td>
                    {comparisonData.map(d => (
                      <td key={d.store.store.id} className="py-2 text-center font-bold text-slate-900">
                        {d.store.store.층수 || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 text-slate-500 font-medium">매니저</td>
                    {comparisonData.map(d => (
                      <td key={d.store.store.id} className="py-2 text-center font-bold text-slate-900">
                        {d.store.store.manager?.name || '-'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 안내 메시지 */}
      {comparisonData.length < 2 && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-700 mb-1">매장을 2개 이상 선택해주세요</p>
          <p className="text-xs text-slate-400">매출, 재고, 베스트 아이템을 나란히 비교할 수 있습니다</p>
        </div>
      )}
    </div>
  );
};

export default StoreComparison;
