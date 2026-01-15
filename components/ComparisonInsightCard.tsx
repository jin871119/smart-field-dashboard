import React, { useState, useEffect, useMemo } from 'react';
import { StoreData } from '../types';
import { findSimilarStores } from '../utils/similarStoreAnalyzer';
import { getComparisonInsights } from '../services/comparisonInsightService';

interface ComparisonInsightCardProps {
  targetStore: StoreData;
  allStores: StoreData[];
  itemSeasonData: any; // Added
}

const ComparisonInsightCard: React.FC<ComparisonInsightCardProps> = ({
  targetStore,
  allStores,
  itemSeasonData // Added
}) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [similarStoresCount, setSimilarStoresCount] = useState<number>(0);

  // 유사 매장 찾기
  const similarStores = useMemo(() => {
    if (!itemSeasonData) return [];
    return findSimilarStores(targetStore, allStores, itemSeasonData);
  }, [targetStore, allStores, itemSeasonData]);

  useEffect(() => {
    setSimilarStoresCount(similarStores.length);
  }, [similarStores]);

  const handleAnalyze = async () => {
    if (similarStores.length === 0) {
      setInsight('매출이 비슷한 매장이 없어 비교 분석을 수행할 수 없습니다. (±20% 범위 내 유사 매장 필요)');
      setIsExpanded(true);
      return;
    }

    setIsExpanded(true);
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

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl shadow-lg shadow-blue-200 mb-6 text-white relative overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-[-10px] left-[-10px] w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>

      <div className="relative z-10">
        {/* 헤더 - 접힘/확장 버튼 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors rounded-t-3xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold">유사 매장 비교 인사이트</h3>
              <p className="text-xs text-blue-100">
                {similarStoresCount > 0
                  ? `12월 매출이 비슷한 ${similarStoresCount}개 매장과 비교`
                  : '비교 대상 매장 없음 (12월 매출 기준)'}
              </p>
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 확장된 내용 */}
        {isExpanded && (
          <div className="px-5 pb-5 space-y-4">
            {!insight && !loading && (
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm text-center">
                <p className="text-xs text-blue-100 mb-3">AI 분석을 통해 유사 매장과의 비교 인사이트를 확인하세요</p>
                <button
                  onClick={handleAnalyze}
                  disabled={similarStoresCount === 0}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${similarStoresCount === 0
                      ? 'bg-white/10 text-blue-200 cursor-not-allowed'
                      : 'bg-white text-indigo-600 hover:bg-blue-50 active:scale-95'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI 분석 시작
                  </div>
                </button>
              </div>
            )}

            {loading && (
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span className="text-xs text-blue-100">AI 분석 중...</span>
                </div>
              </div>
            )}

            {insight && !loading && (
              <>
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

                {/* 유사 매장 목록 표시 */}
                {similarStores.length > 0 && (
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-xs font-semibold text-white mb-2">비교 대상 매장 (12월 매출 기준):</p>
                    <div className="flex flex-wrap gap-2">
                      {similarStores.map((store, idx) => (
                        <div
                          key={store.store.id}
                          className="px-2 py-1 bg-white/20 rounded-lg text-xs text-blue-50"
                        >
                          {idx + 1}. {store.store.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonInsightCard;

