import { MonthlyPerformance } from '../types';

interface PerformanceData {
  매장코드: string;
  판매시점: string; // YYYYMM 형식
  매장명: string;
  판매액: number;
}

interface PerformanceDataJson {
  headers: string[];
  data: PerformanceData[];
  total_rows: number;
}

// 매장명 매칭 함수 (매장정보의 매장명과 실적 데이터의 매장명 매칭)
const matchStoreName = (storeName: string, performanceStoreName: string): boolean => {
  // "롯데본점"과 "29CM(롯데본점)" 매칭
  // 괄호 안의 이름 추출
  const match = performanceStoreName.match(/\(([^)]+)\)/);
  if (match) {
    const nameInBracket = match[1];
    return nameInBracket === storeName || performanceStoreName.includes(storeName);
  }
  return performanceStoreName.includes(storeName) || storeName.includes(performanceStoreName);
};

// 판매시점(YYYYMM)을 월 문자열로 변환
const formatMonth = (salesPoint: string): string => {
  const year = salesPoint.substring(0, 4);
  const month = parseInt(salesPoint.substring(4, 6));
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  return monthNames[month - 1] || `${month}월`;
};

// 실적 데이터를 매장별로 그룹화하고 전년 대비 계산
export const processPerformanceData = (
  performanceDataJson: PerformanceDataJson,
  storeName: string
): {
  monthlyPerformance: MonthlyPerformance[];
  yearToDateRevenue: number; // 연누계 (1~11월)
  yearToDateLastYear: number; // 전년 동기 연누계
  growthRate: number; // 전년 대비 신장률
} => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1~12
  
  // 해당 매장의 데이터만 필터링
  const storeData = performanceDataJson.data.filter(item => 
    matchStoreName(storeName, item.매장명)
  );
  
  // 월별 데이터 정리 (올해와 작년)
  const monthlyData: { [key: string]: { current: number; lastYear: number } } = {};
  
  storeData.forEach(item => {
    const salesPoint = item.판매시점;
    const year = parseInt(salesPoint.substring(0, 4));
    const month = salesPoint.substring(4, 6);
    const monthKey = month;
    
    if (year === currentYear) {
      // 올해 데이터
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { current: 0, lastYear: 0 };
      }
      monthlyData[monthKey].current += item.판매액 || 0;
    } else if (year === currentYear - 1) {
      // 작년 데이터
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { current: 0, lastYear: 0 };
      }
      monthlyData[monthKey].lastYear += item.판매액 || 0;
    }
  });
  
  // MonthlyPerformance 배열 생성 (1월부터 12월까지)
  const monthlyPerformance: MonthlyPerformance[] = [];
  let yearToDateRevenue = 0; // 연누계 (1~11월)
  let yearToDateLastYear = 0; // 전년 동기 연누계
  
  for (let month = 1; month <= 12; month++) {
    const monthKey = String(month).padStart(2, '0');
    const data = monthlyData[monthKey] || { current: 0, lastYear: 0 };
    
    // 만원 단위로 변환
    const currentRevenue = Math.round(data.current / 10000);
    const lastYearRevenue = Math.round(data.lastYear / 10000);
    
    // 전년 대비 신장률 계산
    const growthRate = lastYearRevenue > 0 
      ? ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100 
      : 0;
    
    monthlyPerformance.push({
      month: formatMonth(`${currentYear}${monthKey}`),
      revenue: currentRevenue,
      target: lastYearRevenue, // target을 전년 매출로 사용
      growthRate: growthRate // 전년 대비 신장률 추가
    });
    
    // 1~11월만 연누계에 포함 (12월은 진행중이므로 제외)
    if (month <= 11) {
      yearToDateRevenue += currentRevenue;
      yearToDateLastYear += lastYearRevenue;
    }
  }
  
  // 전년 대비 신장률 계산 (연누계 기준)
  const growthRate = yearToDateLastYear > 0
    ? ((yearToDateRevenue - yearToDateLastYear) / yearToDateLastYear) * 100
    : 0;
  
  return {
    monthlyPerformance,
    yearToDateRevenue,
    yearToDateLastYear,
    growthRate: Math.round(growthRate * 10) / 10 // 소수점 첫째자리까지
  };
};





