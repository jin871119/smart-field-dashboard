import { StoreData } from '../types';
import { analyzeItemSeasonData } from './itemSeasonAnalyzer';

/**
 * 로컬 AI 분석 - Gemini API 실패 시 사용하는 대체 분석 로직
 * 실제 데이터를 기반으로 인사이트를 생성합니다.
 */
export const generateLocalInsight = (storeData: StoreData): string => {
  // 백데이터 분석 추가
  const itemSeasonAnalysis = analyzeItemSeasonData(storeData.store.name);
  const { store, monthlyPerformance, itemPerformance, growthRate, yearToDateRevenue } = storeData;
  
  // 월별 성장률 분석
  const monthlyGrowth = monthlyPerformance
    .filter(p => p.growthRate !== undefined)
    .map(p => p.growthRate!);
  
  const avgGrowth = monthlyGrowth.length > 0
    ? monthlyGrowth.reduce((a, b) => a + b, 0) / monthlyGrowth.length
    : 0;
  
  const positiveMonths = monthlyGrowth.filter(g => g > 0).length;
  const negativeMonths = monthlyGrowth.filter(g => g < 0).length;
  
  // 최고/최저 성장 월 찾기
  const bestMonth = monthlyPerformance.reduce((best, current) => {
    const currentGrowth = current.growthRate || 0;
    const bestGrowth = best.growthRate || 0;
    return currentGrowth > bestGrowth ? current : best;
  }, monthlyPerformance[0]);
  
  const worstMonth = monthlyPerformance.reduce((worst, current) => {
    const currentGrowth = current.growthRate || 0;
    const worstGrowth = worst.growthRate || 0;
    return currentGrowth < worstGrowth ? current : worst;
  }, monthlyPerformance[0]);
  
  // 아이템 성과 분석
  const topItem = itemPerformance.sort((a, b) => b.sales - a.sales)[0];
  const growingItems = itemPerformance.filter(i => i.growth > 0);
  const decliningItems = itemPerformance.filter(i => i.growth < 0);
  
  // 인사이트 생성
  const insights: string[] = [];
  
  // 1. 전체 성장률 분석
  if (growthRate > 0) {
    insights.push(`📈 전년 대비 ${growthRate.toFixed(1)}% 성장! 연매출 ${yearToDateRevenue?.toLocaleString() || 0}만 원 달성`);
  } else if (growthRate < 0) {
    insights.push(`⚠️ 전년 대비 ${Math.abs(growthRate).toFixed(1)}% 감소. 개선이 필요합니다`);
  } else {
    insights.push(`➡️ 전년과 동일한 수준 유지 중`);
  }
  
  // 2. 월별 성장 패턴
  if (positiveMonths > negativeMonths) {
    insights.push(`📊 ${positiveMonths}개월 성장세 지속. ${bestMonth.month}에 ${bestMonth.growthRate?.toFixed(1) || 0}% 최고 성장`);
  } else if (negativeMonths > positiveMonths) {
    insights.push(`📉 ${negativeMonths}개월 하락세. ${worstMonth.month}에 ${worstMonth.growthRate?.toFixed(1) || 0}% 최대 하락`);
  } else {
    insights.push(`📊 성장/하락이 혼재된 패턴. 안정화 필요`);
  }
  
  // 3. 아이템 성과
  if (topItem && topItem.growth > 0) {
    insights.push(`🎯 ${topItem.name} ${topItem.sales}만원 판매 (25년 1~11월), 전년 대비 ${topItem.growth.toFixed(1)}% 성장으로 주력 상품 확인`);
  } else if (decliningItems.length > 0) {
    insights.push(`⚠️ ${decliningItems.length}개 아이템 하락세. 재고 관리 및 프로모션 검토 필요`);
  } else {
    insights.push(`✅ 주요 아이템 안정적 판매 유지`);
  }
  
  // 4. 백데이터 기반 시즌/ITEM 분석
  if (itemSeasonAnalysis.시즌성장분석 !== '성장하는 시즌 없음') {
    insights.push(`📈 ${itemSeasonAnalysis.시즌성장분석} - 주력 시즌 강화 필요`);
  }
  if (itemSeasonAnalysis.시즌성장근거 && itemSeasonAnalysis.시즌성장근거 !== '성장하는 시즌 없음') {
    insights.push(`   📊 시즌별 계산 근거: ${itemSeasonAnalysis.시즌성장근거}`);
  }
  if (itemSeasonAnalysis.시즌감소분석 !== '감소하는 시즌 없음') {
    insights.push(`⚠️ ${itemSeasonAnalysis.시즌감소분석} - 즉시 개선 대응 필요`);
  }
  if (itemSeasonAnalysis.ITEM성장분석 !== '성장하는 ITEM 없음') {
    insights.push(`🎯 ${itemSeasonAnalysis.ITEM성장분석} - 주력 ITEM 확대 검토`);
  }
  if (itemSeasonAnalysis.ITEM성장근거 && itemSeasonAnalysis.ITEM성장근거 !== '성장하는 ITEM 없음') {
    insights.push(`   📊 ITEM별 계산 근거: ${itemSeasonAnalysis.ITEM성장근거}`);
  }
  if (itemSeasonAnalysis.ITEM감소분석 !== '감소하는 ITEM 없음') {
    insights.push(`🚨 ${itemSeasonAnalysis.ITEM감소분석} - 재고 조정 및 프로모션 필요`);
  }
  
  // 5. 반품 분석
  const 반품률 = parseFloat(itemSeasonAnalysis.반품분석.match(/반품률: ([\d.]+)%/)?.[1] || '0');
  if (반품률 > 5) {
    insights.push(`⚠️ 반품률 ${반품률.toFixed(1)}%로 높음. 품질 관리 및 고객 만족도 개선 필요`);
  } else if (반품률 > 0) {
    insights.push(`✅ 반품률 ${반품률.toFixed(1)}%로 양호. 현재 수준 유지 권장`);
  }
  
  // 6. 최근 추이 분석
  if (itemSeasonAnalysis.최근3개월추이) {
    insights.push(`📊 최근 3개월: ${itemSeasonAnalysis.최근3개월추이}`);
  }
  
  // 7. 매니저 정보 기반 인사이트
  if (store.manager.startDate) {
    const startYear = typeof store.manager.startDate === 'string' 
      ? parseInt(store.manager.startDate.split('.')[0])
      : parseInt(store.manager.startDate.toString().split('.')[0]);
    const yearsOfService = new Date().getFullYear() - startYear;
    if (yearsOfService < 2) {
      insights.push(`👤 ${store.manager.name} 매니저는 신규(근속 ${yearsOfService}년). 체계적인 교육 및 멘토링 필요`);
    } else if (yearsOfService >= 5) {
      insights.push(`👤 ${store.manager.name} 매니저는 베테랑(근속 ${yearsOfService}년). 경험 활용한 매장 운영 강화`);
    }
  }
  
  return insights.join('\n\n');
};

