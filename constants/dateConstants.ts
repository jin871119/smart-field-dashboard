/**
 * 날짜/연도 관련 상수
 * 하드코딩된 연도 대신 이 상수를 사용하세요.
 */

/** 최신 데이터 연도 (실적 데이터의 최신 연도로 동적 설정) */
export const getCurrentYear = (): number => new Date().getFullYear();

/** 전년도 */
export const getPreviousYear = (): number => getCurrentYear() - 1;

/** YYYYMM 형식의 월 키 생성 */
export const toYearMonthKey = (year: number, month: number): string =>
  `${year}${String(month).padStart(2, '0')}`;

/** 1~12월 범위의 월별 키 배열 생성 */
export const getYearMonthKeys = (year: number, fromMonth = 1, toMonth = 12): string[] => {
  const keys: string[] = [];
  for (let m = fromMonth; m <= toMonth; m++) {
    keys.push(toYearMonthKey(year, m));
  }
  return keys;
};

/** 두 연도의 월별 판매 합계를 계산 */
export const sumMonthlyValues = (
  item: Record<string, any>,
  year: number,
  fromMonth = 1,
  toMonth = 12
): number => {
  let total = 0;
  for (let month = fromMonth; month <= toMonth; month++) {
    total += item[toYearMonthKey(year, month)] || 0;
  }
  return total;
};
