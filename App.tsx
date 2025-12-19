
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import StoreSelector from './components/StoreSelector';
import StoreInfoCard from './components/StoreInfoCard';
import PerformanceCharts from './components/PerformanceCharts';
import AIInsightCard from './components/AIInsightCard';
import ReportPage from './components/ReportPage';
import { convertExcelDataToStoreData } from './utils/storeDataConverter';
import storeDataJson from './store_data.json';
import performanceDataJson from './performance_data.json';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'report'>('home');
  // Excel 데이터를 변환하여 사용 (실적 데이터 포함)
  const stores = useMemo(() => {
    return convertExcelDataToStoreData(storeDataJson as any, performanceDataJson as any);
  }, []);

  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.store.id || '');

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

  // 연누계 (1~11월)
  const yearToDateRevenue = useMemo(() => {
    if (!selectedData) return 0;
    return selectedData.yearToDateRevenue || 0;
  }, [selectedData]);

  // 전년 대비 신장률
  const growthRate = useMemo(() => {
    if (!selectedData) return 0;
    return selectedData.growthRate || 0;
  }, [selectedData]);

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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">연매출 (1~11월)</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">{yearToDateRevenue.toLocaleString()}</span>
                    <span className="text-[10px] font-medium text-slate-400">만 원</span>
                </div>
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
              <StoreInfoCard store={selectedData.store} />
              
              <AIInsightCard data={selectedData} />

              <PerformanceCharts 
                monthly={selectedData.monthlyPerformance} 
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
        <ReportPage selectedStoreName={selectedData?.store.name || ''} />
      )}
    </Layout>
  );
};

export default App;
