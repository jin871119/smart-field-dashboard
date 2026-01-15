
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import StoreSelector from './components/StoreSelector';
import StoreInfoCard from './components/StoreInfoCard';
import MonthlySalesTrend from './components/MonthlySalesTrend';
import StoreBestItems from './components/StoreBestItems';
import ReportPage from './components/ReportPage';
import ComparisonInsightCard from './components/ComparisonInsightCard';
import { convertExcelDataToStoreData } from './utils/storeDataConverter';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'report'>('home');

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

  // 연누계 (1~12월)
  const yearToDateRevenue = useMemo(() => {
    if (!selectedData) return 0;
    return selectedData.yearToDateRevenue || 0;
  }, [selectedData]);

  // 월평균 (1~12월)
  const monthlyAverage = useMemo(() => {
    if (!selectedData || !selectedData.monthlyPerformance) return 0;
    const totalRevenue = selectedData.yearToDateRevenue || 0;
    // 전체 12개월 기준으로 평균 계산
    return Math.round(totalRevenue / 12);
  }, [selectedData]);

  // 전년 대비 신장률 (연매출 데이터 기반)
  const growthRate = useMemo(() => {
    if (!selectedData) return 0;
    // performance_data.json에서 계산한 신장률 사용
    return selectedData.growthRate || 0;
  }, [selectedData]);

  // 소량단체매출액 (단체 시트 데이터)
  const smallGroupSales = useMemo(() => {
    if (!selectedData || !groupSalesData) return { amount: 0, percentage: 0 };

    const storeName = selectedData.store.name;

    // 매장명으로 매칭
    const storeGroupData = groupSalesData.stores?.find((item: any) => {
      const itemStoreName = item.매장명 || '';
      return itemStoreName === storeName ||
        itemStoreName.includes(storeName) ||
        storeName.includes(itemStoreName);
    });

    if (!storeGroupData) {
      return { amount: 0, percentage: 0 };
    }

    const salesAmount = storeGroupData.소량단체판매액 || 0;
    const salesAmountInManwon = Math.round(salesAmount / 10000); // 만원 단위
    const percentage = yearToDateRevenue > 0
      ? (salesAmountInManwon / yearToDateRevenue) * 100
      : 0;

    return {
      amount: salesAmountInManwon,
      percentage: Math.round(percentage * 10) / 10 // 소수점 첫째자리까지
    };
  }, [selectedData, yearToDateRevenue, groupSalesData]);

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
      title={currentPage === 'home' ? 'Field Insight' : '리포트'}
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

          {/* Quick Summary Widgets */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">연매출 (1~12월)</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold text-slate-900">{Math.round(yearToDateRevenue / 100).toLocaleString()}</span>
                <span className="text-[10px] font-medium text-slate-400">백만 원</span>
              </div>
              {monthlyAverage > 0 && (
                <p className="text-[10px] text-slate-500 mt-1">
                  월평균 {Math.round(monthlyAverage / 100).toLocaleString()}백만원
                </p>
              )}
              {smallGroupSales.amount > 0 && (
                <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-100 pt-2">
                  소량단체매출액 {smallGroupSales.amount.toLocaleString()}만원 (비중 {smallGroupSales.percentage}%)
                </p>
              )}
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">전년 대비 신장률</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${growthRate >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                  {growthRate >= 0 ? '+' : ''}{growthRate}%
                </span>
                <div className={`flex items-center text-[10px] font-bold ${growthRate >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {growthRate >= 0 ? (
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
              <StoreInfoCard store={selectedData.store} />            {/* AI Comparison Insight */}
              <ComparisonInsightCard
                targetStore={selectedData}
                allStores={stores}
                itemSeasonData={itemSeasonData}
                inventoryData={inventoryData}
                competitorData={competitorData}
                storeStyleSalesData={storeStyleSalesData}
              />
              <MonthlySalesTrend monthlyPerformance={selectedData.monthlyPerformance} />

              <StoreBestItems
                selectedStoreName={selectedData.store.name}
                data={storeStyleSalesData}
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
      ) : (
        <ReportPage
          selectedStoreName={selectedData?.store.name || ''}
          data={itemSeasonData}
          inventoryData={inventoryData}
          competitorData={competitorData}
        />
      )}
    </Layout>
  );
};

export default App;
