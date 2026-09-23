/**
 * 매장별 소량단체 판매 데이터
 * DB_SH_S_M의 SALES_EV (이벤트/단체 판매) 컬럼 합산
 * → {매장명, 소량단체판매액}
 */
import { querySnowflake, jsonResponse, errorResponse } from './_snowflake.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const rows = await querySnowflake(`
      SELECT
        SHOP_NM_SHORT          AS "매장명",
        SUM(SALES_EV)          AS "소량단체판매액"
      FROM FNF.PRCS.DB_SH_S_M
      WHERE BRD_CD = 'X'
        AND YYMM >= TO_CHAR(DATEADD('month', -12, DATE_TRUNC('month', CURRENT_DATE())), 'YYYYMM')
      GROUP BY SHOP_NM_SHORT
      ORDER BY SHOP_NM_SHORT
    `);

    jsonResponse(res, { stores: rows });
  } catch (error) {
    errorResponse(res, error);
  }
}
