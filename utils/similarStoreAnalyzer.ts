import { StoreData } from '../types';
import itemSeasonDataJson from '../item_season_data.json';
import storeInventoryDataJson from '../store_inventory_data.json';

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
}

/**
 * 매장의 11월 매출 추출
 */
const getNovemberRevenue = (storeName: string): number => {
  const data = itemSeasonDataJson as any;
  
  const storeItems = data.data.filter((item: ItemSeasonData) => {
    const itemStoreName = item.매장명 || '';
    const match = itemStoreName.match(/\(([^)]+)\)/);
    if (match) {
      return match[1] === storeName;
    }
    return itemStoreName === storeName;
  });

  // 11월 판매액 합계
  let totalRevenue = 0;
  storeItems.forEach((item: ItemSeasonData) => {
    const monthKey = '202511';
    totalRevenue += item[monthKey] || 0;
  });

  return Math.round(totalRevenue / 10000); // 만원 단위
};

/**
 * 매출이 비슷한 매장들을 찾기 (±20% 범위 내, 11월 데이터 기준)
 */
export const findSimilarStores = (
  targetStore: StoreData,
  allStores: StoreData[],
  threshold: number = 0.2 // 20%
): StoreData[] => {
  // 11월 매출 기준으로 비교
  const targetRevenue = getNovemberRevenue(targetStore.store.name);
  const minRevenue = targetRevenue * (1 - threshold);
  const maxRevenue = targetRevenue * (1 + threshold);

  return allStores
    .filter(store => {
      // 자기 자신 제외
      if (store.store.id === targetStore.store.id) return false;
      
      // 11월 매출 기준으로 비교
      const revenue = getNovemberRevenue(store.store.name);
      return revenue >= minRevenue && revenue <= maxRevenue;
    })
    .sort((a, b) => {
      // 매출이 가장 비슷한 순서로 정렬
      const revenueA = getNovemberRevenue(a.store.name);
      const revenueB = getNovemberRevenue(b.store.name);
      const diffA = Math.abs(revenueA - targetRevenue);
      const diffB = Math.abs(revenueB - targetRevenue);
      return diffA - diffB;
    })
    .slice(0, 5); // 상위 5개만
};

/**
 * 매장의 아이템별 판매 데이터 추출 (11월 데이터만)
 */
export const getStoreItemSales = (storeName: string): { [item: string]: number } => {
  const data = itemSeasonDataJson as any;
  
  const storeItems = data.data.filter((item: ItemSeasonData) => {
    const itemStoreName = item.매장명 || '';
    const match = itemStoreName.match(/\(([^)]+)\)/);
    if (match) {
      return match[1] === storeName;
    }
    return itemStoreName === storeName;
  });

  // ITEM별 25년 11월 판매액 집계
  const itemMap: { [key: string]: number } = {};
  
  storeItems.forEach((item: ItemSeasonData) => {
    const itemCode = item.ITEM || '기타';
    if (!itemMap[itemCode]) {
      itemMap[itemCode] = 0;
    }
    
    // 25년 11월 판매액만 (202511)
    const monthKey = '202511';
    itemMap[itemCode] += item[monthKey] || 0;
  });

  return itemMap;
};

/**
 * 매장의 재고 데이터 추출
 */
export const getStoreInventory = (storeName: string, inventoryData?: any): {
  총재고수량: number;
  총재고택가: number;
  시즌별재고: { [season: string]: { 재고수량: number; 재고금액: number } };
} => {
  const data = inventoryData || storeInventoryDataJson;
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
  inventoryData: any
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
  const targetItemSales = getStoreItemSales(targetStore.store.name);
  const targetInventory = getStoreInventory(targetStore.store.name, inventoryData);

  const similarStoresData = similarStores.map(store => ({
    storeName: store.store.name,
    revenue: getNovemberRevenue(store.store.name), // 11월 매출
    itemSales: getStoreItemSales(store.store.name),
    inventory: getStoreInventory(store.store.name, inventoryData)
  }));

  return {
    targetItemSales,
    similarStoresData,
    targetInventory
  };
};

