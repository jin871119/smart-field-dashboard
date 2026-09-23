/**
 * 데이터 서비스
 *
 * 모든 데이터는 public/data/*.json 정적 파일에서 읽는다.
 * JSON 은 지식그래프(KG) API 로 만든다: python scripts/update_from_kg.py YYYY-MM-DD
 */

export interface DataService {
  getStoreData: () => Promise<any>;
  getPerformanceData: () => Promise<any>;
  getGroupSalesData: () => Promise<any>;
  getItemSeasonData: () => Promise<any>;
  getStoreInventoryData: () => Promise<any>;
  getCompetitorData: () => Promise<any>;
  getCompetitorData2026: () => Promise<any>;
  getStoreStyleSalesData: () => Promise<any>;
}

async function fetchJson(path: string): Promise<any> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.statusText}`);
  return res.json();
}

export const dataService: DataService = {
  getStoreData: () =>
    fetchJson('/data/store_data.json'),

  getPerformanceData: () =>
    fetchJson('/data/performance_data.json'),

  getGroupSalesData: () =>
    fetchJson('/data/group_sales_data.json'),

  getItemSeasonData: () =>
    fetchJson('/data/item_season_data.json'),

  getStoreInventoryData: () =>
    fetchJson('/data/store_inventory_data.json'),

  getCompetitorData: () =>
    fetchJson('/data/competitor_data_v2.json'),

  // 2026년 1~8월 마감 기준 점포별 브랜드 월평균 (KG get_kr_sales_competitors)
  getCompetitorData2026: () =>
    fetchJson('/data/competitor_data_2026.json'),

  getStoreStyleSalesData: () =>
    fetchJson('/data/store_style_sales_data.json'),
};
