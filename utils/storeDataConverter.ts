import { StoreData, Store, Manager, MonthlyPerformance, ItemPerformance } from '../types';
import { processPerformanceData } from './performanceConverter';
import itemSeasonDataJson from '../item_season_data.json';

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
    
    // 백데이터에서 실제 ITEM별 판매 데이터 추출
    const itemPerformance: ItemPerformance[] = (() => {
      const seasonData = itemSeasonDataJson as any;
      
      // 매장명 매칭 (정확한 매칭)
      const storeItems = seasonData.data.filter((item: any) => {
        const itemStoreName = item.매장명 || '';
        const storeName = item.매장명; // 현재 매장명
        
        // 괄호 안의 이름 추출 (예: "29CM(롯데본점)" -> "롯데본점")
        const match = itemStoreName.match(/\(([^)]+)\)/);
        if (match) {
          const nameInBracket = match[1];
          // 괄호 안의 이름과 정확히 일치
          return nameInBracket === storeName || storeName === nameInBracket;
        }
        // 괄호가 없으면 직접 매칭
        return itemStoreName === storeName;
      });

      if (storeItems.length === 0) {
        // 데이터가 없으면 빈 배열 반환
        return [];
      }

      // ITEM별 집계 (올해와 작년)
      const itemMap: { [key: string]: { 올해판매액: number; 작년판매액: number; 올해판매수량: number } } = {};
      
      storeItems.forEach((item: any) => {
        const itemCode = item.ITEM || '기타';
        if (!itemMap[itemCode]) {
          itemMap[itemCode] = { 올해판매액: 0, 작년판매액: 0, 올해판매수량: 0 };
        }
        
        // 올해 정상 판매액
        itemMap[itemCode].올해판매액 += item.정상_판매액 || 0;
        itemMap[itemCode].올해판매수량 += item.정상_판매수량 || 0;
        
        // 작년 판매액 (월별 데이터 합계, 12월 제외)
        for (let month = 1; month <= 11; month++) {
          const lastYearKey = `2024${String(month).padStart(2, '0')}`;
          itemMap[itemCode].작년판매액 += item[lastYearKey] || 0;
        }
      });

      return Object.entries(itemMap)
        .map(([ITEM, values]) => {
          const sales = Math.round(values.올해판매수량); // 판매 수량
          const growth = values.작년판매액 > 0
            ? ((values.올해판매액 - values.작년판매액) / values.작년판매액) * 100
            : 0;
          
          return {
            name: ITEM,
            sales: sales,
            growth: Math.round(growth * 10) / 10
          };
        })
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10); // 상위 10개만
    })();
    
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

