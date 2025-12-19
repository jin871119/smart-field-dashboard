import { StoreData, Store, Manager, MonthlyPerformance, ItemPerformance } from '../types';
import { processPerformanceData } from './performanceConverter';

// JSON 파일을 동적으로 import하기 위한 타입
interface ExcelStoreData {
  매장명: string;
  형태: string;
  PY: number;
  성명: string;
  '연락처 ': string;
  생년월일: string;
  SM근무시작일: number | string;
}

interface StoreDataJson {
  headers: string[];
  data: ExcelStoreData[];
  total_rows: number;
}

// 가나다 순 정렬 함수
const koreanSort = (a: string, b: string): number => {
  return a.localeCompare(b, 'ko');
};

// Excel 데이터를 StoreData 형식으로 변환
export const convertExcelDataToStoreData = (
  storeDataJson: StoreDataJson,
  performanceDataJson?: any
): StoreData[] => {
  const excelData = storeDataJson.data;
  
  // 매장명으로 가나다 순 정렬
  const sortedData = [...excelData].sort((a, b) => koreanSort(a.매장명, b.매장명));
  
  return sortedData.map((item, index) => {
    // 매장 ID 생성 (매장명 기반)
    const storeId = `ST-${String(index + 1).padStart(3, '0')}`;
    
    // 연락처 정리 (공백 제거)
    const phone = (item['연락처 '] || '').trim().replace(/\s+/g, '');
    
    // 이메일 생성 (매장명 기반)
    const email = `${item.성명.toLowerCase().replace(/\s+/g, '.')}@retail.com`;
    
    // 아바타 URL 생성 (랜덤 시드 기반)
    const avatarSeed = item.매장명.charCodeAt(0) + (index * 7);
    
    // SM근무시작일을 문자열로 변환
    const startDate = typeof item.SM근무시작일 === 'number' 
      ? `${item.SM근무시작일}` 
      : item.SM근무시작일;
    
    const store: Store = {
      id: storeId,
      name: item.매장명,
      location: item.형태, // 형태를 location으로 사용 (실제 위치 데이터가 없음)
      category: item.형태, // 형태를 category로 사용
      openedDate: startDate,
      py: item.PY, // 평수 추가
      manager: {
        name: item.성명,
        phone: phone,
        email: email,
        avatar: `https://picsum.photos/seed/${avatarSeed}/150/150`,
        position: '매니저',
        birthDate: item.생년월일, // 생년월일 추가
        startDate: startDate // SM근무시작일 추가
      }
    };
    
    // 실적 데이터가 있으면 사용, 없으면 Mock 데이터 생성
    let monthlyPerformance: MonthlyPerformance[];
    let yearToDateRevenue = 0;
    let yearToDateLastYear = 0;
    let growthRate = 0;
    
    if (performanceDataJson) {
      const performance = processPerformanceData(performanceDataJson, item.매장명);
      monthlyPerformance = performance.monthlyPerformance;
      yearToDateRevenue = performance.yearToDateRevenue;
      yearToDateLastYear = performance.yearToDateLastYear;
      growthRate = performance.growthRate;
    } else {
      // Mock 성과 데이터 생성 (실제 데이터가 없을 때)
      monthlyPerformance = [
        { month: "1월", revenue: Math.floor(Math.random() * 3000) + 2000, target: 4000 },
        { month: "2월", revenue: Math.floor(Math.random() * 3000) + 2000, target: 4000 },
        { month: "3월", revenue: Math.floor(Math.random() * 3000) + 2000, target: 5000 },
        { month: "4월", revenue: Math.floor(Math.random() * 3000) + 2000, target: 5000 },
        { month: "5월", revenue: Math.floor(Math.random() * 3000) + 2000, target: 5800 },
        { month: "6월", revenue: Math.floor(Math.random() * 3000) + 2000, target: 6500 }
      ];
    }
    
    const itemPerformance: ItemPerformance[] = [
      { name: "프리미엄 후디", sales: Math.floor(Math.random() * 1000) + 500, growth: Math.random() * 30 - 5 },
      { name: "캔버스 스니커즈", sales: Math.floor(Math.random() * 800) + 400, growth: Math.random() * 30 - 5 },
      { name: "슬림핏 슬랙스", sales: Math.floor(Math.random() * 1500) + 800, growth: Math.random() * 30 - 5 },
      { name: "린넨 셔츠", sales: Math.floor(Math.random() * 1200) + 600, growth: Math.random() * 30 - 5 },
      { name: "볼캡 모자", sales: Math.floor(Math.random() * 500) + 200, growth: Math.random() * 30 - 5 }
    ];
    
    return {
      store,
      monthlyPerformance,
      itemPerformance,
      yearToDateRevenue, // 연누계 (1~11월)
      yearToDateLastYear, // 전년 동기 연누계
      growthRate // 전년 대비 신장률
    };
  });
};

// 매장 목록만 가져오기 (필터용)
export const getStoreList = (storeDataJson: StoreDataJson) => {
  const excelData = storeDataJson.data;
  return [...excelData]
    .map(item => item.매장명)
    .sort(koreanSort);
};

