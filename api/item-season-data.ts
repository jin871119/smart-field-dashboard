/**
 * 아이템×시즌 월별 판매 데이터 (피벗)
 * DB_SH_S_M → {매장코드, 매장명, ITEM, 시즌, 202601, 202512, ...}
 * 최근 13개월치 월 컬럼을 동적으로 생성
 */
import { querySnowflake, jsonResponse, errorResponse } from './_snowflake.js';

/** 최근 N개월 YYYYMM 목록 생성 (내림차순) */
function recentMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const months = recentMonths(13); // 이번달 포함 13개월
    const oldest = months[months.length - 1];

    // 피벗용 CASE 절 동적 생성
    const pivotCols = months
      .map(m => `SUM(CASE WHEN YYMM = '${m}' THEN SALES_TTL ELSE 0 END) AS "${m}"`)
      .join(',\n        ');

    const rows = await querySnowflake(`
      SELECT
        SHOP_ID                    AS "매장코드",
        MAX(SHOP_NM_SHORT)         AS "매장명",
        ITEM                       AS "ITEM",
        SESN                       AS "시즌",
        ${pivotCols}
      FROM FNF.PRCS.DB_SH_S_M
      WHERE BRD_CD = 'X'
        AND YYMM >= '${oldest}'
      GROUP BY SHOP_ID, ITEM, SESN
      HAVING SUM(SALES_TTL) > 0
      ORDER BY SHOP_ID, ITEM, SESN
    `);

    jsonResponse(res, {
      headers: ['매장코드', '매장명', 'ITEM', '시즌', ...months],
      data: rows,
    });
  } catch (error) {
    errorResponse(res, error);
  }
}
