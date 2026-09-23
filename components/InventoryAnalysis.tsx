import React, { useMemo } from 'react';
import { filterByStoreName } from '../utils/storeNameMatcher';

interface InventoryData {
  시즌: string;
  매장코드: string;
  매장명: string;
  매장재고수량: number;
  매장재고택가: number;
}

interface Props {
  selectedStoreName: string;
  inventoryData: { data: InventoryData[] } | null;
  monthlyAvgSales?: number; // 월평균 매출 (원 단위)
}

const InventoryAnalysis: React.FC<Props> = ({
  selectedStoreName,
  inventoryData,
  monthlyAvgSales = 0,
}) => {
  const inventory = useMemo(() => {
    if (!inventoryData || !selectedStoreName) return [];

    const storeInventory = filterByStoreName(
      inventoryData.data,
      selectedStoreName,
      (d: InventoryData) => d.매장명 || ''
    );

    const bySeason: { [season: string]: { qty: number; value: number } } = {};
    storeInventory.forEach(item => {
      const season = item.시즌;
      if (!bySeason[season]) bySeason[season] = { qty: 0, value: 0 };
      bySeason[season].qty += item.매장재고수량 || 0;
      bySeason[season].value += item.매장재고택가 || 0;
    });

    return Object.entries(bySeason)
      .filter(([, v]) => v.qty > 0)
      .map(([season, v]) => ({ 시즌: season, 수량: v.qty, 택가: v.value }))
      .sort((a, b) => b.택가 - a.택가);
  }, [selectedStoreName, inventoryData]);

  if (inventory.length === 0) return null;

  const totalQty = inventory.reduce((s, i) => s + i.수량, 0);
  const totalValue = inventory.reduce((s, i) => s + i.택가, 0);

  // 재고월수 = 총 재고택가 / 월평균 매출
  const inventoryMonths = monthlyAvgSales > 0 ? totalValue / monthlyAvgSales : 0;

  // 판단 기준: ~2개월 적정, 2~4개월 주의, 4개월~ 과재고
  const getStatus = (months: number) => {
    if (months <= 2) return { label: '적정', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✓' };
    if (months <= 4) return { label: '주의', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: '!' };
    return { label: '과재고', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '▲' };
  };

  const status = getStatus(inventoryMonths);

  const formatValue = (v: number) => {
    if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
    if (v >= 10000) return `${Math.round(v / 10000).toLocaleString()}만`;
    return v.toLocaleString();
  };

  const maxValue = Math.max(...inventory.map(i => i.택가));

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
        시즌별 재고현황
      </h3>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">총 재고수량</p>
          <p className="text-sm font-bold text-slate-900">{totalQty.toLocaleString()}개</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">총 재고택가</p>
          <p className="text-sm font-bold text-slate-900">{formatValue(totalValue)}</p>
        </div>
        <div className={`rounded-2xl p-3 text-center ${status.bg} border ${status.border}`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">재고월수</p>
          <p className={`text-sm font-bold ${status.color}`}>
            {inventoryMonths > 0 ? `${inventoryMonths.toFixed(1)}개월` : '-'}
          </p>
        </div>
      </div>

      {/* 재고 판단 배지 */}
      {monthlyAvgSales > 0 && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 ${status.bg} border ${status.border}`}>
          <span className={`text-sm font-bold ${status.color}`}>{status.icon}</span>
          <div className="flex-1">
            <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
            <span className="text-[10px] text-slate-500 ml-2">
              월평균 매출 {formatValue(monthlyAvgSales)} 대비 {inventoryMonths.toFixed(1)}개월분 재고 보유
            </span>
          </div>
        </div>
      )}

      {/* 시즌별 리스트 */}
      <div className="space-y-2.5">
        {inventory.map(item => {
          const barWidth = maxValue > 0 ? (item.택가 / maxValue) * 100 : 0;
          return (
            <div key={item.시즌} className="rounded-xl p-3 border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">{item.시즌}</span>
                <span className="text-[10px] font-medium text-slate-500">
                  {item.수량.toLocaleString()}개
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.max(barWidth, 3)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700 w-14 text-right">
                  {formatValue(item.택가)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        재고월수 = 총 재고택가 / 월평균 매출. 2개월 이하: 적정, 2~4개월: 주의, 4개월 초과: 과재고
      </p>
    </div>
  );
};

export default InventoryAnalysis;
