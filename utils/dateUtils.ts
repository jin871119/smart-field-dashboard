/**
 * 생년월일로부터 나이 계산
 * @param birthDate 생년월일 (YYYY-MM-DD 형식)
 * @returns 나이
 */
export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // 생일이 아직 지나지 않았으면 나이에서 1을 빼기
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('나이 계산 오류:', error);
    return 0;
  }
};

/**
 * 근무시작일로부터 근속연수 계산
 * @param startDate 근무시작일 (YYYY.MM 또는 YYYY-MM-DD 형식)
 * @returns 근속연수 (년 단위, 소수점 첫째자리까지)
 */
export const calculateYearsOfService = (startDate: string | number): number => {
  if (!startDate) return 0;
  
  try {
    let start: Date;
    
    // 숫자 형식인 경우 (예: 2017.07)
    if (typeof startDate === 'number') {
      const year = Math.floor(startDate);
      const month = Math.round((startDate - year) * 100);
      start = new Date(year, month - 1, 1);
    } else {
      // 문자열 형식인 경우
      // YYYY.MM 형식 처리
      if (startDate.includes('.')) {
        const [year, month] = startDate.split('.');
        start = new Date(parseInt(year), parseInt(month) - 1, 1);
      } else {
        // YYYY-MM-DD 형식 처리
        start = new Date(startDate);
      }
    }
    
    const today = new Date();
    
    // 년 차이 계산
    let years = today.getFullYear() - start.getFullYear();
    const monthDiff = today.getMonth() - start.getMonth();
    
    // 월 차이를 고려하여 정확한 근속연수 계산
    const totalMonths = years * 12 + monthDiff;
    const calculatedYears = totalMonths / 12;
    
    // 소수점 첫째자리까지 반올림
    return Math.round(calculatedYears * 10) / 10;
  } catch (error) {
    console.error('근속연수 계산 오류:', error);
    return 0;
  }
};

/**
 * 날짜 포맷팅 (YYYY.MM 형식)
 * @param date 날짜 문자열 또는 숫자
 * @returns 포맷된 날짜 문자열
 */
export const formatDate = (date: string | number): string => {
  if (!date) return '';
  
  try {
    if (typeof date === 'number') {
      const year = Math.floor(date);
      const month = Math.round((date - year) * 100);
      return `${year}.${String(month).padStart(2, '0')}`;
    }
    return date.toString();
  } catch (error) {
    return date.toString();
  }
};





