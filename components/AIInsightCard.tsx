
import React, { useState, useEffect } from 'react';
import { getStoreInsights } from '../services/geminiService';
import { StoreData } from '../types';

interface AIInsightCardProps {
  data: StoreData;
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({ data }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const result = await getStoreInsights(data);
      setInsight(result);
    } catch (e) {
      setInsight("인사이트를 가져오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.store.id]);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-5 shadow-lg shadow-blue-200 mb-6 text-white relative overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-[-10px] left-[-10px] w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-sm font-bold">AI 현장 분석 리포트</h3>
            </div>
            <button 
                onClick={fetchInsights}
                disabled={loading}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 py-2">
            <div className="h-3 w-3/4 bg-white/20 rounded animate-pulse"></div>
            <div className="h-3 w-1/2 bg-white/20 rounded animate-pulse"></div>
            <div className="h-3 w-2/3 bg-white/20 rounded animate-pulse"></div>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-blue-50 font-medium whitespace-pre-wrap">
            {insight}
          </p>
        )}
      </div>
    </div>
  );
};

export default AIInsightCard;
