
export interface Manager {
  name: string;
  phone: string;
  email: string;
  avatar: string;
  position: string;
  birthDate?: string; // 생년월일
  startDate?: string; // SM근무시작일
}

export interface Store {
  id: string;
  name: string;
  location: string;
  category: string;
  openedDate: string;
  manager: Manager;
  py?: number; // 평수
}

export interface MonthlyPerformance {
  month: string;
  revenue: number;
  target: number; // 전년 매출로 사용
  growthRate?: number; // 전년 대비 신장률 (%)
}

export interface ItemPerformance {
  name: string;
  sales: number;
  growth: number;
}

export interface StoreData {
  store: Store;
  monthlyPerformance: MonthlyPerformance[];
  itemPerformance: ItemPerformance[];
  yearToDateRevenue?: number; // 연누계 (1~11월)
  yearToDateLastYear?: number; // 전년 동기 연누계
  growthRate?: number; // 전년 대비 신장률 (%)
}
