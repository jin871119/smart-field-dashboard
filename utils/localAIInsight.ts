import { StoreData } from '../types';

/**
 * 로컬 AI 분석 - Gemini API 실패 시 사용하는 대체 분석 로직
 * 실제 데이터를 기반으로 인사이트를 생성합니다.
 */
export const generateLocalInsight = (storeData: StoreData): string => {
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
    insights.push(`🎯 ${topItem.name} ${topItem.sales}건 판매, ${topItem.growth.toFixed(1)}% 성장으로 주력 상품 확인`);
  } else if (decliningItems.length > 0) {
    insights.push(`⚠️ ${decliningItems.length}개 아이템 하락세. 재고 관리 및 프로모션 검토 필요`);
  } else {
    insights.push(`✅ 주요 아이템 안정적 판매 유지`);
  }
  
  // 4. 매니저 정보 기반 인사이트
  if (store.manager.position) {
    insights.push(`👤 ${store.manager.name} ${store.manager.position}님의 지속적인 관리 노력 필요`);
  }
  
  return insights.join('\n\n');
};

