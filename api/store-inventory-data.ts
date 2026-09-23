/**
 * 매장별 시즌 재고 데이터
 * DB_SH_S_M → {시즌, 매장코드, 매장명, 매장재고수량, 매장재고택가}
 */
import { querySnowflake, jsonResponse, errorResponse } from './_snowflake.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const rows = await querySnowflake(`
      SELECT
        SESN                       AS "시즌",
        SHOP_ID                    AS "매장코드",
        MAX(SHOP_NM_SHORT)         AS "매장명",
        SUM(SH_STOCK_QTY)          AS "매장재고수량",
        0                          AS "매장재고택가"
      FROM FNF.PRCS.DB_SH_S_M
      WHERE BRD_CD = 'X'
        AND SH_STOCK_QTY > 0
        AND YYMM = (
          SELECT MAX(YYMM) FROM FNF.PRCS.DB_SH_S_M WHERE BRD_CD = 'X'
        )
      GROUP BY SESN, SHOP_ID
      ORDER BY SESN DESC, SHOP_ID
    `);

    jsonResponse(res, {
      headers: ['시즌', '매장코드', '매장명', '매장재고수량', '매장재고택가'],
      data: rows,
    });
  } catch (error) {
    errorResponse(res, error);
  }
}
