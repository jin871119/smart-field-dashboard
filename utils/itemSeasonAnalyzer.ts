import { StoreData } from '../types';
// JSON import removed

interface ItemSeasonData {
  매장코드: string;
  매장명: string;
  ITEM: string;
  시즌: string;
  판매수량: number;
  판매액: number;
  판매택가: number;
  정상_판매수량: number;
  정상_판매액: number;
  정상_판매택가: number;
  반품_판매수량: number;
  반품_판매액: number;
  반품_판매택가: number;
  [key: string]: any;
}

/**
 * 선택한 매장의 아이템시즌별판매 데이터를 분석하여 AI 분석에 포함할 정보를 추출
 */
export const analyzeItemSeasonData = (storeName: string, itemSeasonData: any): {
  시즌별요약: string;
  ITEM별요약: string;
  반품분석: string;
  월별패턴: string;
  전체신장률?: number;
  시즌성장근거?: string;
  ITEM성장근거?: string;
  시즌성장분석?: string;
  시즌감소분석?: string;
  ITEM성장분석?: string;
  ITEM감소분석?: string;
  최근3개월추이?: string;
} => {
  const data = itemSeasonData;


  // 매장명 매칭 (정확한 매칭)
  const storeItems = data.data.filter((item: ItemSeasonData) => {
    const itemStoreName = item.매장명 || '';

    // 괄호 안의 이름 추출 (예: "29CM(롯데본점)" -> "롯데본점")
    const match = itemStoreName.match(/\(([^)]+)\)/);
    if (match) {
      const nameInBracket = match[1];
      // 괄호 안의 이름과 정확히 일치하거나 포함 관계 확인
      return nameInBracket === storeName || storeName === nameInBracket;
    }
    // 괄호가 없으면 직접 매칭 (예: "갤러리아진주" == "갤러리아진주")
    return itemStoreName === storeName;
  });

  // 디버깅: 매칭된 데이터 확인
  if (storeItems.length === 0) {
    console.warn(`[itemSeasonAnalyzer] 매장 "${storeName}"에 대한 데이터를 찾을 수 없습니다.`);
    // 매칭 실패 시 빈 데이터 반환
  } else {
    console.log(`[itemSeasonAnalyzer] 매장 "${storeName}"에 대한 ${storeItems.length}개 데이터 발견`);
  }

  if (storeItems.length === 0) {
    return {
      시즌별요약: '해당 매장의 시즌별 데이터가 없습니다.',
      ITEM별요약: '해당 매장의 ITEM별 데이터가 없습니다.',
      반품분석: '반품 데이터가 없습니다.',
      월별패턴: '월별 데이터가 없습니다.'
    };
  }

  // 시즌별 집계
  const seasonMap: { [key: string]: { 판매액: number; 판매수량: number } } = {};
  storeItems.forEach((item: ItemSeasonData) => {
    const season = item.시즌 || '기타';
    if (!seasonMap[season]) {
      seasonMap[season] = { 판매액: 0, 판매수량: 0 };
    }
    seasonMap[season].판매액 += item.판매액 || 0;
    seasonMap[season].판매수량 += item.판매수량 || 0;
  });

  const topSeasons = Object.entries(seasonMap)
    .map(([시즌, values]) => ({
      시즌,
      판매액: Math.round(values.판매액 / 10000),
      판매수량: values.판매수량
    }))
    .sort((a, b) => b.판매액 - a.판매액)
    .slice(0, 5);

  // ITEM별 집계
  const itemMap: { [key: string]: { 판매액: number; 판매수량: number } } = {};
  storeItems.forEach((item: ItemSeasonData) => {
    const itemCode = item.ITEM || '기타';
    if (!itemMap[itemCode]) {
      itemMap[itemCode] = { 판매액: 0, 판매수량: 0 };
    }
    itemMap[itemCode].판매액 += item.판매액 || 0;
    itemMap[itemCode].판매수량 += item.판매수량 || 0;
  });

  const topItems = Object.entries(itemMap)
    .map(([ITEM, values]) => ({
      ITEM,
      판매액: Math.round(values.판매액 / 10000),
      판매수량: values.판매수량
    }))
    .sort((a, b) => b.판매액 - a.판매액)
    .slice(0, 5);

  // 반품 분석
  const total정상판매액 = storeItems.reduce((sum: number, item: ItemSeasonData) => sum + (item.정상_판매액 || 0), 0);
  const total반품판매액 = Math.abs(storeItems.reduce((sum: number, item: ItemSeasonData) => sum + (item.반품_판매액 || 0), 0));
  const 반품률 = total정상판매액 > 0 ? (total반품판매액 / total정상판매액) * 100 : 0;

  // 월별 패턴 분석 (2025년 데이터, 12월 제외)
  const monthlySales: { [key: string]: number } = {};
  for (let month = 1; month <= 11; month++) { // 12월 제외
    const monthKey = `2025${String(month).padStart(2, '0')}`;
    monthlySales[`${month}월`] = storeItems.reduce((sum: number, item: ItemSeasonData) => sum + (item[monthKey] || 0), 0);
  }

  const peakMonth = Object.entries(monthlySales)
    .filter(([_, value]) => value > 0) // 0인 월 제외
    .sort((a, b) => b[1] - a[1])[0];

  // 시즌별 전년 대비 분석 (25년 1~11월 vs 24년 1~11월)
  const seasonGrowth: { [key: string]: { 올해: number; 작년: number } } = {};
  storeItems.forEach((item: ItemSeasonData) => {
    const season = item.시즌 || '기타';
    if (!seasonGrowth[season]) {
      seasonGrowth[season] = { 올해: 0, 작년: 0 };
    }
    // 올해 데이터: 25년 1~11월 월별 데이터 합계
    for (let month = 1; month <= 11; month++) {
      const currentYearKey = `2025${String(month).padStart(2, '0')}`;
      seasonGrowth[season].올해 += item[currentYearKey] || 0;
    }
    // 작년 데이터: 24년 1~11월 월별 데이터 합계
    for (let month = 1; month <= 11; month++) {
      const lastYearKey = `2024${String(month).padStart(2, '0')}`;
      seasonGrowth[season].작년 += item[lastYearKey] || 0;
    }
  });

  const seasonGrowthDetails = Object.entries(seasonGrowth)
    .map(([시즌, values]) => {
      const growthRate = values.작년 > 0 ? ((values.올해 - values.작년) / values.작년) * 100 : 0;
      return { 시즌, 올해: Math.round(values.올해 / 10000), 작년: Math.round(values.작년 / 10000), growthRate };
    })
    .sort((a, b) => b.올해 - a.올해)
    .slice(0, 5);

  const growingSeasons = seasonGrowthDetails.filter(s => s.growthRate > 0);
  const decliningSeasons = seasonGrowthDetails.filter(s => s.growthRate < 0);

  // 시즌별 성장률 계산 근거
  const 시즌성장근거 = growingSeasons.length > 0
    ? growingSeasons.map(s => `${s.시즌}: 25년 ${s.올해}만원 vs 24년 ${s.작년}만원 = ${s.growthRate >= 0 ? '+' : ''}${s.growthRate.toFixed(1)}%`).join(' | ')
    : '성장하는 시즌 없음';

  // ITEM별 전년 대비 분석 (25년 1~11월 vs 24년 1~11월)
  const itemGrowth: { [key: string]: { 올해: number; 작년: number } } = {};
  storeItems.forEach((item: ItemSeasonData) => {
    const itemCode = item.ITEM || '기타';
    if (!itemGrowth[itemCode]) {
      itemGrowth[itemCode] = { 올해: 0, 작년: 0 };
    }
    // 올해 데이터: 25년 1~11월 월별 데이터 합계
    for (let month = 1; month <= 11; month++) {
      const currentYearKey = `2025${String(month).padStart(2, '0')}`;
      itemGrowth[itemCode].올해 += item[currentYearKey] || 0;
    }
    // 작년 데이터: 24년 1~11월 월별 데이터 합계
    for (let month = 1; month <= 11; month++) {
      const lastYearKey = `2024${String(month).padStart(2, '0')}`;
      itemGrowth[itemCode].작년 += item[lastYearKey] || 0;
    }
  });

  const itemGrowthDetails = Object.entries(itemGrowth)
    .map(([ITEM, values]) => {
      const growthRate = values.작년 > 0 ? ((values.올해 - values.작년) / values.작년) * 100 : 0;
      return { ITEM, 올해: Math.round(values.올해 / 10000), 작년: Math.round(values.작년 / 10000), growthRate };
    })
    .sort((a, b) => b.올해 - a.올해)
    .slice(0, 5);

  const growingItems = itemGrowthDetails.filter(i => i.growthRate > 0);
  const decliningItems = itemGrowthDetails.filter(i => i.growthRate < 0);

  // ITEM별 성장률 계산 근거
  const ITEM성장근거 = growingItems.length > 0
    ? growingItems.map(i => `${i.ITEM}: 25년 ${i.올해}만원 vs 24년 ${i.작년}만원 = ${i.growthRate >= 0 ? '+' : ''}${i.growthRate.toFixed(1)}%`).join(' | ')
    : '성장하는 ITEM 없음';

  // 월별 추이 분석 (최근 3개월 vs 전년 동기, 12월 제외)
  const recentMonths = [];
  const currentMonth = new Date().getMonth() + 1;
  for (let i = 2; i >= 0; i--) {
    const month = currentMonth - i;
    if (month > 0 && month <= 11) { // 12월 제외
      const monthKey = `2025${String(month).padStart(2, '0')}`;
      const lastYearKey = `2024${String(month).padStart(2, '0')}`;
      const current = storeItems.reduce((sum: number, item: ItemSeasonData) => sum + (item[monthKey] || 0), 0);
      const lastYear = storeItems.reduce((sum: number, item: ItemSeasonData) => sum + (item[lastYearKey] || 0), 0);
      const growth = lastYear > 0 ? ((current - lastYear) / lastYear) * 100 : 0;
      recentMonths.push({ month: `${month}월`, current: Math.round(current / 10000), lastYear: Math.round(lastYear / 10000), growth });
    }
  }

  // 전체 신장률 계산 (25년 1~11월 vs 24년 1~11월)
  let total올해 = 0;
  let total작년 = 0;
  for (let month = 1; month <= 11; month++) {
    const currentYearKey = `2025${String(month).padStart(2, '0')}`;
    const lastYearKey = `2024${String(month).padStart(2, '0')}`;
    total올해 += storeItems.reduce((sum: number, item: ItemSeasonData) => sum + (item[currentYearKey] || 0), 0);
    total작년 += storeItems.reduce((sum: number, item: ItemSeasonData) => sum + (item[lastYearKey] || 0), 0);
  }
  const 전체신장률 = total작년 > 0 ? ((total올해 - total작년) / total작년) * 100 : 0;

  return {
    시즌별요약: `주요 시즌: ${topSeasons.map(s => `${s.시즌}(${s.판매액}만원)`).join(', ')}`,
    ITEM별요약: `주요 ITEM: ${topItems.map(i => `${i.ITEM}(${i.판매액}만원, ${i.판매수량}건)`).join(', ')}`,
    반품분석: `반품률: ${반품률.toFixed(1)}% (정상판매 ${Math.round(total정상판매액 / 10000)}만원, 반품 ${Math.round(total반품판매액 / 10000)}만원)`,
    월별패턴: peakMonth ? `2025년 최고 판매월: ${peakMonth[0]} (${Math.round(peakMonth[1] / 10000)}만원)` : '월별 데이터 없음',
    시즌성장분석: growingSeasons.length > 0
      ? `성장 시즌: ${growingSeasons.map(s => `${s.시즌}(+${s.growthRate.toFixed(1)}%)`).join(', ')}`
      : '성장하는 시즌 없음',
    시즌감소분석: decliningSeasons.length > 0
      ? `감소 시즌: ${decliningSeasons.map(s => `${s.시즌}(${s.growthRate.toFixed(1)}%)`).join(', ')}`
      : '감소하는 시즌 없음',
    ITEM성장분석: growingItems.length > 0
      ? `성장 ITEM: ${growingItems.map(i => `${i.ITEM}(+${i.growthRate.toFixed(1)}%)`).join(', ')}`
      : '성장하는 ITEM 없음',
    ITEM감소분석: decliningItems.length > 0
      ? `감소 ITEM: ${decliningItems.map(i => `${i.ITEM}(${i.growthRate.toFixed(1)}%)`).join(', ')}`
      : '감소하는 ITEM 없음',
    최근3개월추이: recentMonths.map(m => `${m.month}: ${m.current}만원 (전년 ${m.lastYear}만원, ${m.growth >= 0 ? '+' : ''}${m.growth.toFixed(1)}%)`).join(' | '),
    전체신장률: Math.round(전체신장률 * 10) / 10,
    시즌성장근거: 시즌성장근거,
    ITEM성장근거: ITEM성장근거
  };
};

