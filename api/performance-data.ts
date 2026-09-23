/**
 * 매장별 월간 실적 데이터
 * DB_SH_S_M (매장×스타일 월 집계) → {판매시점, 매장명, 판매액}
 */
import { querySnowflake, jsonResponse, errorResponse } from './_snowflake.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const rows = await querySnowflake(`
      SELECT
        YYMM                   AS "판매시점",
        SHOP_NM_SHORT          AS "매장명",
        SUM(SALES_TTL)         AS "판매액"
      FROM FNF.PRCS.DB_SH_S_M
      WHERE BRD_CD = 'X'
        AND YYMM >= TO_CHAR(DATEADD('month', -24, DATE_TRUNC('month', CURRENT_DATE())), 'YYYYMM')
      GROUP BY YYMM, SHOP_NM_SHORT
      ORDER BY YYMM, SHOP_NM_SHORT
    `);

    jsonResponse(res, {
      headers: ['판매시점', '매장명', '판매액'],
      data: rows,
    });
  } catch (error) {
    errorResponse(res, error);
  }
}
