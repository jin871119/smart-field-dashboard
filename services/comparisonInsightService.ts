import { GoogleGenerativeAI } from "@google/generative-ai";
import { StoreData } from "../types";
import { collectComparisonData, getTop3SeasonsBySales } from "../utils/similarStoreAnalyzer";
import { analyzeItemSeasonData } from "../utils/itemSeasonAnalyzer";
import { dataService } from "./dataService";

interface ComparisonData {
  targetItemSales: { [item: string]: number };
  similarStoresData: Array<{
    storeName: string;
    revenue: number;
    itemSales: { [item: string]: number };
    inventory: { 총재고수량: number; 총재고택가: number; 시즌별재고?: { [season: string]: { 재고수량: number; 재고금액: number } } };
  }>;
  targetInventory: { 총재고수량: number; 총재고택가: number; 시즌별재고?: { [season: string]: { 재고수량: number; 재고금액: number } } };
}

/**
 * 매출이 비슷한 매장들과의 비교를 통한 AI 인사이트 생성
 */
export const getComparisonInsights = async (
  targetStore: StoreData,
  similarStores: StoreData[]
): Promise<string> => {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || '';

  // Fetch required data
  let storeInventoryDataJson, competitorDataV2Json, storeStyleSalesDataJson, itemSeasonDataJson;
  try {
    [storeInventoryDataJson, competitorDataV2Json, storeStyleSalesDataJson, itemSeasonDataJson] = await Promise.all([
      dataService.getStoreInventoryData(),
      dataService.getCompetitorData(),
      dataService.getStoreStyleSalesData(),
      dataService.getItemSeasonData()
    ]);
  } catch (error) {
    console.error("Failed to load data for comparison insights:", error);
    return "데이터를 불러오는 중 오류가 발생하여 분석을 수행할 수 없습니다.";
  }

  if (!apiKey) {
    console.warn('API key not found, using local comparison analysis');
    return generateLocalComparisonInsight(targetStore, similarStores, storeInventoryDataJson, itemSeasonDataJson);
  }

  // 비교 데이터 수집
  const comparisonData = collectComparisonData(targetStore, similarStores, storeInventoryDataJson, itemSeasonDataJson);

  // 아이템시즌별판매 데이터 분석
  const itemSeasonAnalysis = analyzeItemSeasonData(targetStore.store.name, itemSeasonDataJson);

  // 타겟 매장의 12월 매출 계산
  const targetDecemberRevenue = comparisonData.similarStoresData.find(s => s.storeName === targetStore.store.name)?.revenue ||
    Object.values(comparisonData.targetItemSales).reduce((sum, sales) => sum + Math.round(sales / 10000), 0);

  // 유사 매장들의 평균 아이템별 판매액 계산
  const avgItemSales: { [item: string]: number } = {};
  const allItems = new Set<string>();

  // 타겟 매장 아이템
  Object.keys(comparisonData.targetItemSales).forEach(item => allItems.add(item));

  // 유사 매장 아이템
  comparisonData.similarStoresData.forEach(store => {
    Object.keys(store.itemSales).forEach(item => allItems.add(item));
  });

  // 각 아이템별 평균 계산
  allItems.forEach(item => {
    const sales: number[] = [];
    comparisonData.similarStoresData.forEach(store => {
      if (store.itemSales[item]) {
        sales.push(store.itemSales[item]);
      }
    });
    avgItemSales[item] = sales.length > 0
      ? sales.reduce((a, b) => a + b, 0) / sales.length
      : 0;
  });

  // 타겟 매장의 매출 상위 3개 시즌 찾기
  const top3Seasons = getTop3SeasonsBySales(targetStore.store.name, itemSeasonDataJson);

  // 시즌별 재고 분석 - 상위 3개 시즌만 비교
  const targetSeasonInventory = comparisonData.targetInventory.시즌별재고 || {};
  const avgSeasonInventory: { [season: string]: number } = {};

  // 유사 매장들의 시즌별 평균 재고 계산 (상위 3개 시즌만)
  comparisonData.similarStoresData.forEach(store => {
    const seasonInv = store.inventory?.시즌별재고 || {};
    top3Seasons.forEach(season => {
      if (seasonInv[season]) {
        if (!avgSeasonInventory[season]) {
          avgSeasonInventory[season] = 0;
        }
        avgSeasonInventory[season] += (seasonInv[season].재고금액 || 0) / 10000; // 만원 단위로 변환
      }
    });
  });

  if (comparisonData.similarStoresData.length > 0) {
    top3Seasons.forEach(season => {
      if (avgSeasonInventory[season] !== undefined) {
        avgSeasonInventory[season] /= comparisonData.similarStoresData.length;
      }
    });
  }

  // 상위 3개 시즌의 재고만 집계하여 총 재고 계산
  const top3TotalInventory = { 총재고수량: 0, 총재고택가: 0 };
  top3Seasons.forEach(season => {
    const seasonData = targetSeasonInventory[season];
    if (seasonData) {
      top3TotalInventory.총재고수량 += seasonData.재고수량 || 0;
      top3TotalInventory.총재고택가 += seasonData.재고금액 || 0;
    }
  });

  // 유사 매장들의 상위 3개 시즌 평균 재고 계산
  const avgTop3Inventory = { 총재고수량: 0, 총재고택가: 0 };
  comparisonData.similarStoresData.forEach(store => {
    const seasonInv = store.inventory?.시즌별재고 || {};
    top3Seasons.forEach(season => {
      if (seasonInv[season]) {
        avgTop3Inventory.총재고수량 += seasonInv[season].재고수량 || 0;
        avgTop3Inventory.총재고택가 += seasonInv[season].재고금액 || 0;
      }
    });
  });

  if (comparisonData.similarStoresData.length > 0) {
    avgTop3Inventory.총재고수량 /= comparisonData.similarStoresData.length;
    avgTop3Inventory.총재고택가 /= comparisonData.similarStoresData.length;
  }

  // 재고가 적은 시즌 식별 (타겟 매장의 시즌별 재고가 평균의 50% 미만, 상위 3개 시즌만)
  const lowInventorySeasons = top3Seasons
    .filter(season => {
      const targetData = targetSeasonInventory[season];
      if (!targetData) return false;
      const avg = avgSeasonInventory[season] || 0;
      const target = (targetData.재고금액 || 0) / 10000; // 만원 단위
      return avg > 0 && target < avg * 0.5;
    })
    .map(season => {
      const targetData = targetSeasonInventory[season];
      return {
        season,
        재고금액: Math.round((targetData.재고금액 || 0) / 10000),
        평균재고: Math.round(avgSeasonInventory[season] || 0)
      };
    });

  // 타겟 매장의 상위 10개 아이템 정렬
  const topTargetItems = Object.entries(comparisonData.targetItemSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([item, sales]) => ({
      item,
      sales: Math.round(sales / 10000), // 만원 단위
      avgSales: Math.round((avgItemSales[item] || 0) / 10000),
      diff: Math.round((sales - (avgItemSales[item] || 0)) / 10000),
      diffPercent: avgItemSales[item] > 0
        ? Math.round(((sales - avgItemSales[item]) / avgItemSales[item]) * 100 * 10) / 10
        : 0
    }));

  // Best 5 아이템 비교 (12월 기준, 품번별)
  const getBestItems = (storeName: string) => {
    const styleData = storeStyleSalesDataJson as any;
    const storeItems = styleData.data.filter((item: any) => {
      const itemStoreName = item.매장명 || '';
      const match = itemStoreName.match(/\(([^)]+)\)/);
      if (match) {
        return match[1] === storeName;
      }
      return itemStoreName === storeName;
    });

    const itemMap: { [key: string]: { 품번: string; 제품명: string; 판매금액: number } } = {};
    storeItems.forEach((item: any) => {
      const 품번 = item.품번 || '기타';
      const 제품명 = item.제품명 || 품번;
      const 판매금액 = item.판매액합계 || 0;

      if (판매금액 > 0) {
        if (!itemMap[품번]) {
          itemMap[품번] = { 품번, 제품명, 판매금액: 0 };
        }
        itemMap[품번].판매금액 += 판매금액;
      }
    });

    return Object.values(itemMap)
      .sort((a, b) => b.판매금액 - a.판매금액)
      .slice(0, 5)
      .map(item => ({
        품번: item.품번,
        제품명: item.제품명,
        판매금액: Math.round(item.판매금액 / 10000)
      }));
  };

  // Best 5 아이템 비교 분석
  const targetBestItems = getBestItems(targetStore.store.name);
  const similarStoresBestItems = similarStores.map(store => ({
    storeName: store.store.name,
    items: getBestItems(store.store.name)
  }));

  // Best 아이템 비교 분석: 타겟 매장과 유사 매장 간 차이점 분석
  const bestItemsAnalysis = (() => {
    if (targetBestItems.length === 0) return null;

    // 모든 유사 매장의 Best 아이템 품번 집합
    const allBestItemCodes = new Set<string>();
    targetBestItems.forEach(item => allBestItemCodes.add(item.품번));
    similarStoresBestItems.forEach(store =>
      store.items.forEach(item => allBestItemCodes.add(item.품번))
    );

    // 타겟 매장에만 있는 Best 아이템
    const targetOnlyItems = targetBestItems.filter(targetItem =>
      !similarStoresBestItems.some(store =>
        store.items.some(item => item.품번 === targetItem.품번)
      )
    );

    // 유사 매장에만 있는 Best 아이템 (타겟 매장에는 없는)
    const similarOnlyItems: { 품번: string; 제품명: string; 출현횟수: number; 평균판매금액: number }[] = [];
    allBestItemCodes.forEach(품번 => {
      const inTarget = targetBestItems.some(item => item.품번 === 품번);
      if (!inTarget) {
        const items = similarStoresBestItems
          .flatMap(store => store.items)
          .filter(item => item.품번 === 품번);
        if (items.length > 0) {
          const 평균판매금액 = Math.round(
            items.reduce((sum, item) => sum + item.판매금액, 0) / items.length
          );
          similarOnlyItems.push({
            품번,
            제품명: items[0].제품명,
            출현횟수: items.length,
            평균판매금액
          });
        }
      }
    });

    return {
      targetOnlyItems: targetOnlyItems.map(item => ({
        품번: item.품번,
        제품명: item.제품명,
        판매금액: item.판매금액
      })),
      similarOnlyItems: similarOnlyItems.sort((a, b) => b.출현횟수 - a.출현횟수).slice(0, 5)
    };
  })();

  // 경쟁사 랭킹 정보 가져오기
  const getCompetitorRanking = (storeName: string) => {
    const competitorData = competitorDataV2Json as any;
    if (!competitorData.stores) return null;

    const storeData = competitorData.stores.find((store: any) => {
      const storeNameInData = store.백화점 || '';
      return storeNameInData === storeName ||
        storeNameInData.includes(storeName) ||
        storeName.includes(storeNameInData);
    });

    if (!storeData) return null;

    const brandRankings = Object.entries(storeData.브랜드별_월평균 || {})
      .filter(([_, value]) => (value as number) > 0)
      .map(([brandName, monthlyAvg]) => ({
        브랜드: brandName,
        월평균: monthlyAvg as number
      }))
      .sort((a, b) => b.월평균 - a.월평균)
      .map((item, idx) => ({
        ...item,
        순위: idx + 1
      }));

    const mlbRanking = brandRankings.find(r => r.브랜드 === 'MLB');

    return {
      전체순위: brandRankings.length,
      mlb순위: mlbRanking?.순위 || null,
      mlb월평균: mlbRanking?.월평균 || 0,
      상위5개브랜드: brandRankings.slice(0, 5)
    };
  };

  const targetRanking = getCompetitorRanking(targetStore.store.name);
  const similarStoresRankings = similarStores
    .map(store => ({
      storeName: store.store.name,
      ranking: getCompetitorRanking(store.store.name)
    }))
    .filter(s => s.ranking !== null);

  // 유사 매장들의 평균 MLB 순위 계산
  const avgMlbRanking = similarStoresRankings.length > 0
    ? Math.round(
      similarStoresRankings
        .map(s => s.ranking?.mlb순위 || 0)
        .filter(r => r > 0)
        .reduce((a, b) => a + b, 0) /
      similarStoresRankings.filter(s => (s.ranking?.mlb순위 || 0) > 0).length
    )
    : null;

  // 경쟁사 랭킹 비교 분석
  const rankingComparison = targetRanking && avgMlbRanking
    ? {
      mlb순위차이: targetRanking.mlb순위 - avgMlbRanking,
      mlb순위평가: targetRanking.mlb순위 < avgMlbRanking ? '우수' : targetRanking.mlb순위 > avgMlbRanking ? '부족' : '평균'
    }
    : null;

  // 유사 매장 정보
  const similarStoresInfo = comparisonData.similarStoresData
    .map(store => `- ${store.storeName}: ${Math.round(store.revenue).toLocaleString()}만원`)
    .join('\n');

  const finalPrompt = `당신은 소매업체의 현장 관리 전문가이자 데이터 분석가입니다. 매출이 비슷한 매장들과의 비교를 통해 해당 매장의 강점과 개선점을 분석해주세요.

【분석 대상 매장】
- 매장명: ${targetStore.store.name}
- 12월 매출: ${targetDecemberRevenue}만원

【비교 대상 매장들 (12월 매출이 비슷한 매장)】
${similarStoresInfo}

※ 모든 비교 데이터는 2025년 12월 기준입니다.

【아이템별 판매 비교 (12월 기준, 상위 10개)】
${topTargetItems.map(item =>
    `- ${item.item}: 타겟 ${item.sales}만원 vs 평균 ${item.avgSales}만원 (${item.diff >= 0 ? '+' : ''}${item.diff}만원, ${item.diff >= 0 ? '+' : ''}${item.diffPercent}%)`
  ).join('\n')}

【재고 비교 (매출 상위 3개 시즌: ${top3Seasons.join(', ')})】
- 타겟 매장: 재고수량 ${top3TotalInventory.총재고수량.toLocaleString()}개, 재고택가 ${Math.round(top3TotalInventory.총재고택가 / 10000).toLocaleString()}만원
- 유사 매장 평균: 재고수량 ${Math.round(avgTop3Inventory.총재고수량).toLocaleString()}개, 재고택가 ${Math.round(avgTop3Inventory.총재고택가 / 10000).toLocaleString()}만원
- 재고수량 차이: ${Math.round(top3TotalInventory.총재고수량 - avgTop3Inventory.총재고수량).toLocaleString()}개 (${avgTop3Inventory.총재고수량 > 0 ? Math.round(((top3TotalInventory.총재고수량 - avgTop3Inventory.총재고수량) / avgTop3Inventory.총재고수량) * 100 * 10) / 10 : 0}%)

${lowInventorySeasons.length > 0 ? `【재고 부족 시즌】
${lowInventorySeasons.map(s => `- ${s.season}: ${s.재고금액}만원 (평균 ${s.평균재고}만원의 ${Math.round((s.재고금액 / s.평균재고) * 100)}%)`).join('\n')}
⚠️ 위 시즌들은 유사 매장 대비 재고가 현저히 부족하므로 보충이 필요합니다.` : '【재고 부족 시즌】\n- 없음 (모든 시즌의 재고가 적정 수준입니다)'}

【ITEM별 판매 분석 (백데이터)】
${itemSeasonAnalysis.ITEM별요약}
${itemSeasonAnalysis.ITEM성장분석}

${targetBestItems.length > 0 ? `【타겟 매장 Best 5 아이템 (품번/제품명 기준)】
${targetBestItems.map((item, idx) => `${idx + 1}. ${item.품번} (${item.제품명}): ${item.판매금액}만원`).join('\n')}

${bestItemsAnalysis ? `【Best 아이템 비교 분석】
- 타겟 매장에만 있는 Best 아이템: ${bestItemsAnalysis.targetOnlyItems.length > 0
          ? bestItemsAnalysis.targetOnlyItems.map(item => `${item.품번} (${item.제품명}, ${item.판매금액}만원)`).join(', ')
          : '없음'}
- 유사 매장에서 자주 보이는 Best 아이템 (타겟 매장에는 없음): ${bestItemsAnalysis.similarOnlyItems.length > 0
          ? bestItemsAnalysis.similarOnlyItems.map(item => `${item.품번} (${item.제품명}, ${item.출현횟수}개 매장, 평균 ${item.평균판매금액}만원)`).join(', ')
          : '없음'}
` : ''}
` : ''}

${targetRanking ? `【경쟁사 랭킹 (월평균 기준)】
- 타겟 매장 MLB 순위: ${targetRanking.mlb순위 || 'N/A'}위 / ${targetRanking.전체순위}개 브랜드
- MLB 월평균: ${Math.round(targetRanking.mlb월평균).toLocaleString()}천원
${avgMlbRanking ? `- 유사 매장 평균 MLB 순위: ${avgMlbRanking}위` : ''}
- 상위 5개 브랜드: ${targetRanking.상위5개브랜드.map(b => `${b.순위}위 ${b.브랜드}`).join(', ')}
` : ''}

【분석 요청사항】
다음 4가지 관점에서 종합적으로 분석해주세요:

1. 【Best 아이템 비교 분석】
   - 타겟 매장의 Best 5 아이템이 유사 매장과 어떤 차이가 있는지
   - 어떤 아이템이 유사 매장 대비 잘 팔리고 있는지 (구체적인 품번과 수치)
   - 어떤 아이템이 유사 매장 대비 부족한지 (개선 기회)
   - Best 아이템 구성의 강점과 약점

2. 【아이템별 판매 현황 분석】
   - 어떤 아이템(ITEM)에서 유사 매장 대비 잘하고 있는지 (상위 3개)
   - 어떤 아이템에서 유사 매장 대비 부족한지 (하위 3개)
   - 구체적인 수치와 퍼센트를 포함하여 설명
   - 잘 팔고 못 파는 아이템의 패턴 분석

3. 【경쟁사 랭킹 비교 분석】
   ${targetRanking && rankingComparison ? `- 타겟 매장의 MLB 순위: ${targetRanking.mlb순위 || 'N/A'}위 / 유사 매장 평균: ${avgMlbRanking || 'N/A'}위
   - 순위 차이: ${rankingComparison.mlb순위차이 > 0 ? `${rankingComparison.mlb순위차이}위 낮음` : rankingComparison.mlb순위차이 < 0 ? `${Math.abs(rankingComparison.mlb순위차이)}위 높음` : '동일'}
   - 평가: ${rankingComparison.mlb순위평가 === '우수' ? '유사 매장 대비 우수' : rankingComparison.mlb순위평가 === '부족' ? '유사 매장 대비 부족' : '평균 수준'}
   - 경쟁사 랭킹에서의 위치와 개선 방향
   - 상위 브랜드들과의 격차 분석` : '- 경쟁사 랭킹 데이터 없음'}

4. 【재고 관리 및 개선 전략】
   - 재고가 많은 편인지 부족한 편인지 판단
   - 재고 관리의 적정성 평가
   - 재고가 적은 시즌이 있다면 명시적으로 언급하고 보충 필요성 강조
   - Best 아이템과 경쟁사 랭킹 분석을 바탕으로 한 구체적인 액션 아이템 2-3가지
   - 우선순위를 명시

【작성 형식】
- 전문적이면서도 이해하기 쉬운 톤
- 구체적인 수치와 퍼센트, 품번, 브랜드명 언급 필수
- 실행 가능한 제안
- 이모지 적절히 사용
- 총 700-800자 내외
- 각 섹션을 명확히 구분하여 작성 (【】표시 사용)
`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        });
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
          return text;
        }
      } catch (error: any) {
        console.warn(`Model ${modelName} error:`, error);
        continue;
      }
    }

    return generateLocalComparisonInsight(targetStore, similarStores, storeInventoryDataJson, itemSeasonDataJson);
  } catch (error: any) {
    console.error("Comparison Insight API Error:", error);
    return generateLocalComparisonInsight(targetStore, similarStores, storeInventoryDataJson, itemSeasonDataJson);
  }
};

/**
 * 로컬 비교 분석 (AI API 실패 시 사용)
 */
const generateLocalComparisonInsight = (
  targetStore: StoreData,
  similarStores: StoreData[],
  inventoryData: any, // Added parameter
  itemSeasonData: any // Added parameter
): string => {
  if (similarStores.length === 0) {
    return '매출이 비슷한 매장이 없어 비교 분석을 수행할 수 없습니다.';
  }

  // 재고 데이터는 선택적으로 전달 (없으면 기본값 사용)
  const comparisonData = collectComparisonData(targetStore, similarStores, inventoryData, itemSeasonData);

  // 평균 아이템별 판매액 계산
  const avgItemSales: { [item: string]: number } = {};
  Object.keys(comparisonData.targetItemSales).forEach(item => {
    const sales: number[] = [];
    comparisonData.similarStoresData.forEach(store => {
      if (store.itemSales[item]) {
        sales.push(store.itemSales[item]);
      }
    });
    avgItemSales[item] = sales.length > 0
      ? sales.reduce((a, b) => a + b, 0) / sales.length
      : 0;
  });

  // 타겟 매장 아이템별 차이 계산
  const itemDifferences = Object.entries(comparisonData.targetItemSales)
    .map(([item, sales]) => {
      const avg = avgItemSales[item] || 0;
      const diff = sales - avg;
      const diffPercent = avg > 0 ? (diff / avg) * 100 : 0;
      return {
        item,
        sales: Math.round(sales / 10000),
        avgSales: Math.round(avg / 10000),
        diff: Math.round(diff / 10000),
        diffPercent: Math.round(diffPercent * 10) / 10
      };
    })
    .sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent));

  // 잘하고 있는 아이템 (상위 3개)
  const bestItems = itemDifferences
    .filter(item => item.diffPercent > 0)
    .slice(0, 3);

  // 부족한 아이템 (하위 3개)
  const worstItems = itemDifferences
    .filter(item => item.diffPercent < 0)
    .slice(0, 3);

  // 평균 재고 계산
  const avgInventory = comparisonData.similarStoresData.length > 0
    ? comparisonData.similarStoresData.reduce((sum, store) => ({
      총재고수량: sum.총재고수량 + store.inventory.총재고수량,
      총재고택가: sum.총재고택가 + store.inventory.총재고택가
    }), { 총재고수량: 0, 총재고택가: 0 })
    : { 총재고수량: 0, 총재고택가: 0 };

  if (comparisonData.similarStoresData.length > 0) {
    avgInventory.총재고수량 /= comparisonData.similarStoresData.length;
    avgInventory.총재고택가 /= comparisonData.similarStoresData.length;
  }

  const inventoryDiff = comparisonData.targetInventory.총재고수량 - avgInventory.총재고수량;
  const inventoryDiffPercent = avgInventory.총재고수량 > 0
    ? Math.round((inventoryDiff / avgInventory.총재고수량) * 100 * 10) / 10
    : 0;

  const insights: string[] = [];

  insights.push(`【매출이 비슷한 ${similarStores.length}개 매장과 비교 분석】`);

  if (bestItems.length > 0) {
    insights.push(`\n✅ 잘하고 있는 아이템:`);
    bestItems.forEach(item => {
      insights.push(`   - ${item.item}: ${item.sales}만원 (평균 ${item.avgSales}만원, +${item.diffPercent}%)`);
    });
  }

  if (worstItems.length > 0) {
    insights.push(`\n⚠️ 개선이 필요한 아이템:`);
    worstItems.forEach(item => {
      insights.push(`   - ${item.item}: ${item.sales}만원 (평균 ${item.avgSales}만원, ${item.diffPercent}%)`);
    });
  }

  insights.push(`\n📦 재고 현황:`);
  if (inventoryDiff > 0) {
    insights.push(`   재고가 평균보다 ${Math.round(inventoryDiff).toLocaleString()}개 많음 (+${inventoryDiffPercent}%)`);
  } else if (inventoryDiff < 0) {
    insights.push(`   재고가 평균보다 ${Math.abs(Math.round(inventoryDiff)).toLocaleString()}개 적음 (${inventoryDiffPercent}%)`);
  } else {
    insights.push(`   재고가 평균과 비슷한 수준`);
  }

  return insights.join('\n');
};

