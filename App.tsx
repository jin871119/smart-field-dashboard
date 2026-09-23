
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import StoreSelector from './components/StoreSelector';
import StoreInfoCard from './components/StoreInfoCard';
import MonthlySalesTrend from './components/MonthlySalesTrend';
import StoreBestItems from './components/StoreBestItems';
import ReportPage from './components/ReportPage';

import StoreMemo from './components/StoreMemo';
import MonthlyKPICards from './components/MonthlyKPICards';
import InventoryAnalysis from './components/InventoryAnalysis';
import StoreComparison from './components/StoreComparison';
import { convertExcelDataToStoreData } from './utils/storeDataConverter';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'report' | 'analysis'>('home');

  const [storeData, setStoreData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [groupSalesData, setGroupSalesData] = useState<any>(null);
  const [itemSeasonData, setItemSeasonData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [competitorData, setCompetitorData] = useState<any>(null);
  const [storeStyleSalesData, setStoreStyleSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sData, pData, gData, iData, invData, cData, ssData] = await Promise.all([
          dataService.getStoreData(),
          dataService.getPerformanceData(),
          dataService.getGroupSalesData(),
          dataService.getItemSeasonData(),
          dataService.getStoreInventoryData(),
          dataService.getCompetitorData(),
          dataService.getStoreStyleSalesData()
        ]);
        setStoreData(sData);
        setPerformanceData(pData);
        setGroupSalesData(gData);
        setItemSeasonData(iData);
        setInventoryData(invData);
        setCompetitorData(cData);
        setStoreStyleSalesData(ssData);
      } catch (err) {
        console.error("Failed to load initial data", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Excel 데이터를 변환하여 사용 (실적 데이터 포함)
  const stores = useMemo(() => {
    if (!storeData || !performanceData || !itemSeasonData) return [];
    return convertExcelDataToStoreData(storeData, performanceData, itemSeasonData);
  }, [storeData, performanceData, itemSeasonData]);

  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('누계');

  // stores가 로드되면 첫 번째 매장 선택
  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].store.id);
    }
  }, [stores, selectedStoreId]);

  const selectedData = useMemo(() => {
    if (stores.length === 0) return null;
    return stores.find(s => s.store.id === selectedStoreId) || stores[0];
  }, [selectedStoreId, stores]);

  // 실적이 있는 월 목록
  const availableMonths = useMemo(() => {
    if (!selectedData?.monthlyPerformance) return [];
    return selectedData.monthlyPerformance
      .filter(m => m.revenue > 0)
      .map(m => m.month);
  }, [selectedData]);

  // 선택 월에 따른 매출/신장률 계산
  const { displayRevenue, displayGrowthRate, displayLabel, displaySubtext } = useMemo(() => {
    if (!selectedData?.monthlyPerformance) {
      return { displayRevenue: 0, displayGrowthRate: 0, displayLabel: '누계', displaySubtext: '' };
    }

    if (selectedMonth === '누계') {
      const rev = selectedData.yearToDateRevenue || 0;
      const activeMonths = selectedData.activeMonths || 1;
      const avg = Math.round(rev / activeMonths);
      return {
        displayRevenue: rev,
        displayGrowthRate: selectedData.growthRate || 0,
        displayLabel: `${activeMonths}개월 누계`,
        displaySubtext: `월평균 ${Math.round(avg / 100).toLocaleString()}백만원`,
      };
    }

    const monthData = selectedData.monthlyPerformance.find(m => m.month === selectedMonth);
    if (!monthData) {
      return { displayRevenue: 0, displayGrowthRate: 0, displayLabel: selectedMonth, displaySubtext: '' };
    }
    return {
      displayRevenue: monthData.revenue,
      displayGrowthRate: monthData.growthRate || 0,
      displayLabel: selectedMonth,
      displaySubtext: `전년 동월 ${monthData.target > 0 ? Math.round(monthData.target / 100).toLocaleString() + '백만원' : '-'}`,
    };
  }, [selectedData, selectedMonth]);


  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-100 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-slate-900 font-bold mb-2">오류 발생</p>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      title={currentPage === 'home' ? 'Field Insight' : currentPage === 'report' ? '리포트' : '분석'}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    >
      {currentPage === 'home' ? (
        <>
          <StoreSelector
            stores={stores}
            selectedId={selectedStoreId}
            onSelect={setSelectedStoreId}
          />

          {/* 월 필터 */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {['누계', ...availableMonths].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedMonth === m
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Quick Summary Widgets */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {selectedMonth === '누계' ? '매출' : selectedMonth + ' 매출'} ({displayLabel})
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold text-slate-900">{displayRevenue > 0 ? Math.round(displayRevenue / 100).toLocaleString() : '-'}</span>
                <span className="text-[10px] font-medium text-slate-400">백만 원</span>
              </div>
              {displaySubtext && (
                <p className="text-[10px] text-slate-500 mt-1">{displaySubtext}</p>
              )}
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">전년 대비 신장률</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${displayGrowthRate >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                  {displayGrowthRate >= 0 ? '+' : ''}{displayGrowthRate.toFixed(1)}%
                </span>
                <div className={`flex items-center text-[10px] font-bold ${displayGrowthRate >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {displayGrowthRate >= 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>

          {selectedData && (
            <>
              <StoreInfoCard store={selectedData.store} />
              <StoreMemo storeId={selectedData.store.id} storeName={selectedData.store.name} />
              <MonthlySalesTrend monthlyPerformance={selectedData.monthlyPerformance} />

              <StoreBestItems
                selectedStoreName={selectedData.store.name}
                data={storeStyleSalesData}
              />

              <InventoryAnalysis
                selectedStoreName={selectedData.store.name}
                inventoryData={inventoryData}
                monthlyAvgSales={selectedData.activeMonths && selectedData.yearToDateRevenue
                  ? (selectedData.yearToDateRevenue / selectedData.activeMonths) * 10000
                  : 0}
              />
            </>
          )}

          {/* Floating Action Button for Visits */}
          <button className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </>
      ) : currentPage === 'report' ? (
        <ReportPage
          selectedStoreName={selectedData?.store.name || ''}
          data={itemSeasonData}
          inventoryData={inventoryData}
          competitorData={competitorData}
          currentYear={selectedData?.currentYear || 2026}
        />
      ) : (
        <StoreComparison
          stores={stores}
          itemSeasonData={itemSeasonData}
          inventoryData={inventoryData}
          currentYear={selectedData?.currentYear || 2026}
        />
      )}
    </Layout>
  );
};

export default App;
