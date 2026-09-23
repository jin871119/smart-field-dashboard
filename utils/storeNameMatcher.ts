/**
 * 매장명 매칭 유틸리티
 *
 * DB에서 오는 매장명 형식:
 *  - "롯데본점" (직접)
 *  - "29CM(롯데본점)" (괄호 안에 실제 매장명)
 *
 * 이 모듈은 위 두 형식 모두를 처리하는 단일 매칭 로직을 제공합니다.
 */

/** 괄호 안의 이름을 추출 (예: "29CM(롯데본점)" → "롯데본점") */
const extractBracketName = (name: string): string | null => {
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
};

/**
 * 매장명이 일치하는지 확인
 * @param targetName 찾으려는 매장명 (예: "롯데본점")
 * @param dataName 데이터에서 오는 매장명 (예: "29CM(롯데본점)" 또는 "롯데본점")
 */
export const matchStoreName = (targetName: string, dataName: string): boolean => {
  if (!targetName || !dataName) return false;

  // 1. 정확한 일치
  if (dataName === targetName) return true;

  // 2. 괄호 안 이름과 일치
  const bracketName = extractBracketName(dataName);
  if (bracketName && bracketName === targetName) return true;

  // 3. 울산 예외 처리 (현대울산 ≠ 현대울산동구)
  if (targetName === '현대울산' && dataName === '현대울산동구') return false;
  if (targetName === '현대울산동구' && dataName === '현대울산') return false;

  return false;
};

/**
 * 데이터 배열에서 특정 매장의 항목만 필터링
 * @param items 필터링할 데이터 배열
 * @param targetName 찾으려는 매장명
 * @param getNameFn 각 항목에서 매장명을 추출하는 함수
 */
export const filterByStoreName = <T>(
  items: T[],
  targetName: string,
  getNameFn: (item: T) => string
): T[] => {
  return items.filter(item => matchStoreName(targetName, getNameFn(item)));
};
