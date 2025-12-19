import { StoreData } from '../types';
import itemSeasonDataJson from '../item_season_data.json';

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
export const analyzeItemSeasonData = (storeName: string): {
  시즌별요약: string;
  ITEM별요약: string;
  반품분석: string;
  월별패턴: string;
} => {
  const data = itemSeasonDataJson as any;
  
  // 매장명 매칭
  const storeItems = data.data.filter((item: ItemSeasonData) => {
    const itemStoreName = item.매장명 || '';
    const match = itemStoreName.match(/\(([^)]+)\)/);
    if (match) {
      const nameInBracket = match[1];
      return nameInBracket === storeName || itemStoreName.includes(storeName);
    }
    return itemStoreName.includes(storeName) || storeName.includes(itemStoreName);
  });

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

  // 월별 패턴 분석 (2025년 데이터)
  const monthlySales: { [key: string]: number } = {};
  for (let month = 1; month <= 12; month++) {
    const monthKey = `2025${String(month).padStart(2, '0')}`;
    monthlySales[`${month}월`] = storeItems.reduce((sum: number, item: ItemSeasonData) => sum + (item[monthKey] || 0), 0);
  }

  const peakMonth = Object.entries(monthlySales)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    시즌별요약: `주요 시즌: ${topSeasons.map(s => `${s.시즌}(${s.판매액}만원)`).join(', ')}`,
    ITEM별요약: `주요 ITEM: ${topItems.map(i => `${i.ITEM}(${i.판매액}만원, ${i.판매수량}건)`).join(', ')}`,
    반품분석: `반품률: ${반품률.toFixed(1)}% (정상판매 ${Math.round(total정상판매액/10000)}만원, 반품 ${Math.round(total반품판매액/10000)}만원)`,
    월별패턴: `2025년 최고 판매월: ${peakMonth[0]} (${Math.round(peakMonth[1]/10000)}만원)`
  };
};

