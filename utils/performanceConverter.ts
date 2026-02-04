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
  yearToDateRevenue: number; // 연누계 (실적이 있는 월 합계)
  yearToDateLastYear: number; // 전년 동기 연누계
  growthRate: number; // 전년 대비 신장률
  currentYear: number; // 데이터 상의 최신 연도
  activeMonths: number; // 실적이 있는 개월 수 (올해 기준)
} => {
  // performance_data.json에서 실제 데이터 연도 추출 (가장 최신 연도 찾기)
  let currentYear = new Date().getFullYear();
  if (performanceDataJson.data && performanceDataJson.data.length > 0) {
    const years = performanceDataJson.data
      .map((item: any) => {
        const salesPoint = item.판매시점;
        return (salesPoint && typeof salesPoint === 'string') ? parseInt(salesPoint.substring(0, 4)) : 0;
      })
      .filter((y: number) => y > 2000 && y <= 2100);

    if (years.length > 0) {
      currentYear = Math.max(...years);
    }
  }
  const currentMonth = new Date().getMonth() + 1; // 1~12

  // 해당 매장의 데이터만 필터링
  const storeData = performanceDataJson.data.filter(item =>
    matchStoreName(storeName, item.매장명)
  );

  // 월별 데이터 정리 (올해와 작년)
  const monthlyData: { [key: string]: { current: number; lastYear: number } } = {};

  storeData.forEach(item => {
    const salesPoint = item.판매시점;
    if (!salesPoint || typeof salesPoint !== 'string' || salesPoint.length < 6) {
      return;
    }
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
  let yearToDateRevenue = 0; // 연누계 (1~12월)
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

    // 올해 실적이 있는 월만 연누계 및 신장률 계산에 포함
    if (currentRevenue > 0) {
      yearToDateRevenue += currentRevenue;
      yearToDateLastYear += lastYearRevenue;
    }
  }

  // 실적이 있는 개월 수 계산 (올해 데이터 기준)
  const activeMonths = monthlyPerformance.filter(m => m.revenue > 0).length || 1;

  // 전년 대비 신장률 계산 (연누계 기준)
  const growthRate = yearToDateLastYear > 0
    ? ((yearToDateRevenue - yearToDateLastYear) / yearToDateLastYear) * 100
    : 0;

  return {
    monthlyPerformance,
    yearToDateRevenue,
    yearToDateLastYear,
    growthRate: Math.round(growthRate * 10) / 10, // 소수점 첫째자리까지
    currentYear,
    activeMonths
  };
};





