import { StoreData } from '../types';
// Imports removed

interface ItemSeasonData {
  매장코드: string;
  매장명: string;
  ITEM: string;
  시즌: string;
  판매액: number;
  판매수량: number;
  [key: string]: any;
}

interface StoreInventoryData {
  매장코드: string;
  매장명: string;
  매장재고수량: number;
  매장재고택가: number;
  시즌?: string;
}

/**
 * 매장의 12월 매출 추출
 */
const getDecemberRevenue = (storeName: string, itemSeasonData: any): number => {
  const data = itemSeasonData;

  const storeItems = data.data.filter((item: ItemSeasonData) => {
    const itemStoreName = item.매장명 || '';
    const match = itemStoreName.match(/\(([^)]+)\)/);
    if (match) {
      return match[1] === storeName;
    }
    return itemStoreName === storeName;
  });

  // 12월 판매액 합계
  let totalRevenue = 0;
  storeItems.forEach((item: ItemSeasonData) => {
    const monthKey = '202512';
    totalRevenue += item[monthKey] || 0;
  });

  return Math.round(totalRevenue / 10000); // 만원 단위
};

/**
 * 매출이 비슷한 매장들을 찾기 (±20% 범위 내, 12월 데이터 기준)
 */
export const findSimilarStores = (
  targetStore: StoreData,
  allStores: StoreData[],
  itemSeasonData: any, // Added
  threshold: number = 0.2 // 20%
): StoreData[] => {
  // 12월 매출 기준으로 비교
  const targetRevenue = getDecemberRevenue(targetStore.store.name, itemSeasonData);

  // 타겟 매장의 매출이 0이면 유사 매장을 찾을 수 없음
  if (targetRevenue === 0) {
    return [];
  }

  const minRevenue = targetRevenue * (1 - threshold);
  const maxRevenue = targetRevenue * (1 + threshold);

  // 매장 ID와 매출을 매핑하여 중복 제거 및 정렬
  const storeRevenueMap = new Map<string, { store: StoreData; revenue: number; diff: number }>();

  allStores.forEach(store => {
    // 자기 자신 제외
    if (store.store.id === targetStore.store.id) return;

    // 이미 처리된 매장 제외
    if (storeRevenueMap.has(store.store.id)) return;

    // 12월 매출 기준으로 비교
    const revenue = getDecemberRevenue(store.store.name, itemSeasonData);

    if (revenue >= minRevenue && revenue <= maxRevenue) {
      const diff = Math.abs(revenue - targetRevenue);
      storeRevenueMap.set(store.store.id, { store, revenue, diff });
    }
  });

  // 매출 차이가 작은 순서로 정렬하고 상위 5개만 선택
  return Array.from(storeRevenueMap.values())
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 5)
    .map(item => item.store);
};

/**
 * 매장의 아이템별 판매 데이터 추출 (12월 데이터만)
 */
export const getStoreItemSales = (storeName: string, itemSeasonData: any): { [item: string]: number } => {
  const data = itemSeasonData;

  const storeItems = data.data.filter((item: ItemSeasonData) => {
    const itemStoreName = item.매장명 || '';
    const match = itemStoreName.match(/\(([^)]+)\)/);
    if (match) {
      return match[1] === storeName;
    }
    return itemStoreName === storeName;
  });

  // ITEM별 25년 12월 판매액 집계
  const itemMap: { [key: string]: number } = {};

  storeItems.forEach((item: ItemSeasonData) => {
    const itemCode = item.ITEM || '기타';
    if (!itemMap[itemCode]) {
      itemMap[itemCode] = 0;
    }

    // 25년 12월 판매액만 (202512)
    const monthKey = '202512';
    itemMap[itemCode] += item[monthKey] || 0;
  });

  return itemMap;
};

/**
 * 매장의 시즌별 매출 추출 (12월 기준)
 */
export const getStoreSeasonSales = (storeName: string, itemSeasonData: any): { [season: string]: number } => {
  const data = itemSeasonData;

  const storeItems = data.data.filter((item: ItemSeasonData) => {
    const itemStoreName = item.매장명 || '';
    const match = itemStoreName.match(/\(([^)]+)\)/);
    if (match) {
      return match[1] === storeName;
    }
    return itemStoreName === storeName;
  });

  // 시즌별 12월 판매액 집계
  const seasonSales: { [season: string]: number } = {};

  storeItems.forEach((item: ItemSeasonData) => {
    const season = item.시즌 || '기타';
    if (!seasonSales[season]) {
      seasonSales[season] = 0;
    }

    // 25년 12월 판매액만 (202512)
    const monthKey = '202512';
    seasonSales[season] += item[monthKey] || 0;
  });

  return seasonSales;
};

/**
 * 매장의 매출 상위 3개 시즌 추출
 */
export const getTop3SeasonsBySales = (storeName: string, itemSeasonData: any): string[] => {
  const seasonSales = getStoreSeasonSales(storeName, itemSeasonData);

  return Object.entries(seasonSales)
    .filter(([_, sales]) => sales > 0) // 매출이 있는 시즌만
    .sort(([, a], [, b]) => b - a) // 매출 높은 순으로 정렬
    .slice(0, 3) // 상위 3개
    .map(([season]) => season);
};

/**
 * 매장의 재고 데이터 추출
 */
export const getStoreInventory = (storeName: string, inventoryData: any): {
  총재고수량: number;
  총재고택가: number;
  시즌별재고: { [season: string]: { 재고수량: number; 재고금액: number } };
} => {
  const data = inventoryData;
  if (!data || !data.data) {
    return { 총재고수량: 0, 총재고택가: 0, 시즌별재고: {} };
  }

  const storeInventories = data.data.filter((item: StoreInventoryData) => {
    const itemStoreName = item.매장명 || '';
    const match = itemStoreName.match(/\(([^)]+)\)/);
    if (match) {
      return match[1] === storeName;
    }
    return itemStoreName === storeName;
  });

  const 총재고수량 = storeInventories.reduce((sum: number, item: StoreInventoryData) =>
    sum + (item.매장재고수량 || 0), 0);
  const 총재고택가 = storeInventories.reduce((sum: number, item: StoreInventoryData) =>
    sum + (item.매장재고택가 || 0), 0);

  // 시즌별 재고 집계
  const 시즌별재고: { [season: string]: { 재고수량: number; 재고금액: number } } = {};
  storeInventories.forEach((item: StoreInventoryData) => {
    const season = item.시즌 || '기타';
    if (!시즌별재고[season]) {
      시즌별재고[season] = { 재고수량: 0, 재고금액: 0 };
    }
    시즌별재고[season].재고수량 += item.매장재고수량 || 0;
    시즌별재고[season].재고금액 += item.매장재고택가 || 0;
  });

  return { 총재고수량, 총재고택가, 시즌별재고 };
};

/**
 * 타겟 매장과 유사 매장들의 비교 데이터 수집
 */
export const collectComparisonData = (
  targetStore: StoreData,
  similarStores: StoreData[],
  inventoryData: any,
  itemSeasonData: any // Added
): {
  targetItemSales: { [item: string]: number };
  similarStoresData: Array<{
    storeName: string;
    revenue: number;
    itemSales: { [item: string]: number };
    inventory: { 총재고수량: number; 총재고택가: number; 시즌별재고: { [season: string]: { 재고수량: number; 재고금액: number } } };
  }>;
  targetInventory: { 총재고수량: number; 총재고택가: number; 시즌별재고: { [season: string]: { 재고수량: number; 재고금액: number } } };
} => {
  const targetItemSales = getStoreItemSales(targetStore.store.name, itemSeasonData);
  const targetInventory = getStoreInventory(targetStore.store.name, inventoryData);

  const similarStoresData = similarStores.map(store => ({
    storeName: store.store.name,
    revenue: getDecemberRevenue(store.store.name, itemSeasonData), // 12월 매출
    itemSales: getStoreItemSales(store.store.name, itemSeasonData),
    inventory: getStoreInventory(store.store.name, inventoryData)
  }));

  return {
    targetItemSales,
    similarStoresData,
    targetInventory
  };
};

