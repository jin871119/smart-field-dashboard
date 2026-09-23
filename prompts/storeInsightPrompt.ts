import { StoreData } from "../types";

interface ItemSeasonAnalysis {
  시즌별요약: string;
  ITEM별요약: string;
  반품분석: string;
  월별패턴: string;
  시즌성장분석?: string;
  시즌감소분석?: string;
  ITEM성장분석?: string;
  ITEM감소분석?: string;
  시즌성장근거?: string;
  ITEM성장근거?: string;
  최근3개월추이?: string;
}

export const buildStoreInsightPrompt = (
  storeData: StoreData,
  itemSeasonAnalysis: ItemSeasonAnalysis
): string => {
  const monthlyDetails = storeData.monthlyPerformance
    .map(p => `${p.month}: ${p.revenue}만원 (전년 ${p.target}만원, ${p.growthRate && p.growthRate >= 0 ? '+' : ''}${p.growthRate?.toFixed(1) || 0}%)`)
    .join('\n');

  const topItems = storeData.itemPerformance
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map(i => `- ${i.name}: ${i.sales}만원 판매, 전년 대비 ${i.growth >= 0 ? '+' : ''}${i.growth.toFixed(1)}%`)
    .join('\n');

  const managerYears = storeData.store.manager.startDate
    ? new Date().getFullYear() - parseInt(storeData.store.manager.startDate.toString().split('.')[0])
    : 0;

  return `당신은 소매업체의 현장 관리 전문가이자 데이터 분석가입니다. 다음 매장의 상세 데이터를 심층 분석하여 실무진이 즉시 실행할 수 있는 전략적 인사이트를 제공해주세요.

【매장 기본 정보】
- 매장명: ${storeData.store.name}
- 매장 형태: ${storeData.store.category}
- 위치: ${storeData.store.location}
- 매장 평수: ${storeData.store.py || 'N/A'}평
- 담당 매니저: ${storeData.store.manager.name} (${storeData.store.manager.position}, 근속 ${managerYears}년)

【핵심 성과 지표】
- 연매출: ${storeData.yearToDateRevenue?.toLocaleString() || 0}만원
- 전년 대비 신장률: ${storeData.growthRate && storeData.growthRate >= 0 ? '+' : ''}${storeData.growthRate?.toFixed(1) || 0}%

【월별 실적 상세 분석 (전년 대비)】
${monthlyDetails}

【주요 아이템 성과 (상위 5개)】
${topItems}

【시즌별 판매 분석 (백데이터)】
${itemSeasonAnalysis.시즌별요약}
${itemSeasonAnalysis.시즌성장분석}
${itemSeasonAnalysis.시즌감소분석}
계산 근거: ${itemSeasonAnalysis.시즌성장근거 || '데이터 없음'}

【ITEM별 판매 분석 (백데이터)】
${itemSeasonAnalysis.ITEM별요약}
${itemSeasonAnalysis.ITEM성장분석}
${itemSeasonAnalysis.ITEM감소분석}
계산 근거: ${itemSeasonAnalysis.ITEM성장근거 || '데이터 없음'}

【반품 분석】
${itemSeasonAnalysis.반품분석}

【월별 판매 패턴】
${itemSeasonAnalysis.월별패턴}

【최근 3개월 추이】
${itemSeasonAnalysis.최근3개월추이}

【심층 분석 요청사항】
다음 5가지 관점에서 종합적으로 분석해주세요:

1. 【성과 종합 평가】매장의 전반적인 성과를 2-3문장으로 요약
   - 강점: 성장하고 있는 영역과 우수한 지표
   - 약점: 개선이 필요한 영역과 위험 신호
   - 구체적인 수치와 퍼센트를 반드시 포함

2. 【위험 신호 & 기회 포착】가장 주목해야 할 핵심 이슈 2가지
   - 위험 신호: 즉시 대응이 필요한 문제점 (예: 특정 시즌/ITEM 급감, 반품률 상승 등)
   - 기회 포착: 성장 동력이 되는 요소 (예: 급성장 시즌/ITEM, 최근 개선 추세 등)
   - 각각 구체적인 수치와 데이터를 근거로 제시

3. 【시즌/ITEM 전략 분석】백데이터를 바탕으로 한 전략적 제안
   - 주력 시즌/ITEM의 강화 방안 (성장하는 시즌/ITEM을 어떻게 더 활용할 것인가)
   - 저성과 시즌/ITEM의 개선 방안 (감소하는 시즌/ITEM을 어떻게 회복시킬 것인가)
   - 시즌별/ITEM별 우선순위 제시

4. 【반품 & 품질 관리】반품 데이터를 바탕으로 한 인사이트
   - 반품률이 높다면 원인 분석 및 대응 방안
   - 반품률이 낮다면 유지 방안

5. 【즉시 실행 액션】우선순위별 구체적인 액션 아이템 3가지
   - 1순위: 가장 시급한 개선 사항 (측정 가능한 목표 포함)
   - 2순위: 중기 개선 사항
   - 3순위: 장기 전략 사항
   - 각 액션은 구체적이고 실행 가능해야 함

【작성 형식】
- 전문적이면서도 이해하기 쉬운 톤
- 구체적인 수치와 퍼센트 언급 필수 (예: "24N 시즌이 전년 대비 15.3% 증가")
- 실행 가능하고 측정 가능한 제안
- 이모지 적절히 사용 (섹션별 1-2개, 총 8-10개)
- 총 600-700자 내외
- 각 섹션을 명확히 구분하여 작성 (【】표시 사용)
- 위험 신호는 빨간색 이모지, 기회는 초록색 이모지 사용 권장
`;
};
