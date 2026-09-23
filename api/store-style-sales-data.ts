/**
 * 매장별 스타일(품번) 판매 데이터
 * DB_SH_S_M → {매장명, 품번, 제품명, 판매액합계, 판매수량합계}
 * 최근 완료된 달 기준
 */
import { querySnowflake, jsonResponse, errorResponse } from './_snowflake.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    // 요청 파라미터로 기준 월 지정 가능 (없으면 전월)
    const targetYymm: string =
      (req.query?.yymm as string) ||
      (() => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - 1);
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
      })();

    const rows = await querySnowflake(`
      SELECT
        SHOP_NM_SHORT          AS "매장명",
        STYLE_CD               AS "품번",
        MAX(PRDT_NM)           AS "제품명",
        SUM(SALES_TTL)         AS "판매액합계",
        SUM(QTY)               AS "판매수량합계"
      FROM FNF.PRCS.DB_SH_S_M
      WHERE BRD_CD = 'X'
        AND YYMM = '${targetYymm}'
      GROUP BY SHOP_NM_SHORT, STYLE_CD
      HAVING SUM(SALES_TTL) > 0
      ORDER BY SHOP_NM_SHORT, SUM(SALES_TTL) DESC
    `);

    jsonResponse(res, {
      headers: ['매장명', '품번', '제품명', '판매액합계', '판매수량합계'],
      data: rows,
    });
  } catch (error) {
    errorResponse(res, error);
  }
}
