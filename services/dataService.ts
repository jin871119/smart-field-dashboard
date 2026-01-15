export interface DataService {
  getStoreData: () => Promise<any>;
  getPerformanceData: () => Promise<any>;
  getGroupSalesData: () => Promise<any>;
  getItemSeasonData: () => Promise<any>;
  getStoreInventoryData: () => Promise<any>;
  getCompetitorData: () => Promise<any>;
  getStoreStyleSalesData: () => Promise<any>;
}

const BASE_PATH = '/data';

const fetchData = async (filename: string) => {
  try {
    const response = await fetch(`${BASE_PATH}/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    throw error;
  }
};

export const dataService: DataService = {
  getStoreData: () => fetchData('store_data.json'),
  getPerformanceData: () => fetchData('performance_data.json'),
  getGroupSalesData: () => fetchData('group_sales_data.json'),
  getItemSeasonData: () => fetchData('item_season_data.json'),
  getStoreInventoryData: () => fetchData('store_inventory_data.json'),
  getCompetitorData: () => fetchData('competitor_data_v2.json'),
  getStoreStyleSalesData: () => fetchData('store_style_sales_data.json'),
};
