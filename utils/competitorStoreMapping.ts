/**
 * 매장명 ↔ 경쟁사(백화점) 시트명 매핑
 * 매장 데이터와 경쟁사 시트의 명칭이 다를 경우 여기서 매칭
 *
 * ※ 더현대서울: backdata 경쟁사 시트에 해당 행이 없으면 경쟁사 데이터가 표시되지 않습니다.
 *   경쟁사 시트 A열(백화점)에 "더현대서울" 또는 "더현대 서울"로 추가 후 read_competitor_v2_fixed.py 또는 update_data_unified.py 실행 필요.
 */
export const STORE_TO_COMPETITOR_ALIAS: Record<string, string[]> = {
  '더현대서울': ['더현대서울', '더현대 서울', '현대서울', '더현대'],
  '더현대울산': ['더현대울산', '더현대 울산', '현대울산'],
  '갤러리아광교': ['갤러리아광교', '갤러리아 광교'],
};

/**
 * 매장명으로 경쟁사 데이터에서 사용할 검색 후보 목록 반환
 */
export const getCompetitorSearchNames = (storeName: string): string[] => {
  const aliases = STORE_TO_COMPETITOR_ALIAS[storeName];
  return aliases ? [storeName, ...aliases] : [storeName];
};
