/**
 * 매장 마스터 데이터
 * DW_SHOP → {매장명, 형태, 성명, 연락처, 등급, 층수}
 * PY(평수)는 Snowflake에 없으므로 생략 (기존 JSON 병합은 프론트에서 처리)
 */
import { querySnowflake, jsonResponse, errorResponse } from './_snowflake.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const rows = await querySnowflake(`
      SELECT
        SHOP_NM_SHORT          AS "매장명",
        COALESCE(
          NULLIF(ANLYS_DIST_TYPE_DTL, ''),
          NULLIF(ANAL_DIST_TYPE_NM, ''),
          ANAL_DIST_TYPE
        )                      AS "형태",
        COALESCE(SHOP_MNG_NM, '') AS "성명",
        COALESCE(SHOP_PHONE, '')  AS "연락처 ",
        COALESCE(SHOP_RANK, '')   AS "등급",
        COALESCE(FLOOR, '')       AS "층수"
      FROM FNF.PRCS.DW_SHOP
      WHERE BRD_CD = 'X'
        AND (CLOSE_DT IS NULL OR CLOSE_DT >= CURRENT_DATE())
        AND CNTRY = 'KR'
      ORDER BY SHOP_NM_SHORT
    `);

    jsonResponse(res, {
      headers: ['매장명', '형태', '성명', '연락처 ', '등급', '층수'],
      data: rows,
    });
  } catch (error) {
    errorResponse(res, error);
  }
}
