import React, { useState, useEffect, useMemo } from 'react';
import { StoreData } from '../types';
import { findSimilarStores } from '../utils/similarStoreAnalyzer';
import { getComparisonInsights } from '../services/comparisonInsightService';

interface ComparisonInsightCardProps {
  targetStore: StoreData;
  allStores: StoreData[];
}

const ComparisonInsightCard: React.FC<ComparisonInsightCardProps> = ({ 
  targetStore, 
  allStores 
}) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [similarStoresCount, setSimilarStoresCount] = useState<number>(0);

  // 유사 매장 찾기
  const similarStores = useMemo(() => {
    return findSimilarStores(targetStore, allStores);
  }, [targetStore, allStores]);

  useEffect(() => {
    setSimilarStoresCount(similarStores.length);
    
    if (similarStores.length === 0) {
      setInsight('매출이 비슷한 매장이 없어 비교 분석을 수행할 수 없습니다. (±20% 범위 내 유사 매장 필요)');
      setLoading(false);
      return;
    }

    const fetchInsights = async () => {
      setLoading(true);
      try {
        const result = await getComparisonInsights(targetStore, similarStores);
        setInsight(result);
      } catch (e) {
        console.error('Comparison Insight Error:', e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setInsight(`⚠️ 인사이트를 가져오는데 실패했습니다: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [targetStore.store.id, similarStores]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-5 shadow-lg shadow-blue-200 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-10px] left-[-10px] w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold">유사 매장 비교 인사이트</h3>
              <p className="text-xs text-blue-100">분석 중...</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>AI 분석 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-5 shadow-lg shadow-blue-200 mb-6 text-white relative overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-[-10px] left-[-10px] w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">유사 매장 비교 인사이트</h3>
            <p className="text-xs text-blue-100">
              {similarStoresCount > 0 
                ? `매출이 비슷한 ${similarStoresCount}개 매장과 비교` 
                : '비교 대상 매장 없음'}
            </p>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs leading-relaxed whitespace-pre-line">
            {insight.split('\n').map((line, idx) => {
              // 섹션 헤더 스타일링
              if (line.includes('【') && line.includes('】')) {
                return (
                  <div key={idx} className="font-bold text-white mt-3 mb-2 first:mt-0">
                    {line}
                  </div>
                );
              }
              // 일반 텍스트
              return (
                <div key={idx} className="text-blue-50">
                  {line || <br />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonInsightCard;

