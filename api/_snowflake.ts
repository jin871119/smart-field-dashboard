/**
 * Snowflake 연결 유틸리티 (snowflake-sdk + RSA 키페어 인증)
 *
 * 필요한 환경변수 (.env.local 또는 Vercel 환경변수):
 *   SNOWFLAKE_ACCOUNT          = gv28284.ap-northeast-2.aws
 *   SNOWFLAKE_USER             = 사용자명
 *   SNOWFLAKE_PRIVATE_KEY_PATH = ./snowflake_rsa_key.p8  (로컬 개발용)
 *   SNOWFLAKE_PRIVATE_KEY      = <PEM 전체 내용>          (Vercel 클라우드용)
 *   SNOWFLAKE_WAREHOUSE        = DEV_WH  (기본값)
 *   SNOWFLAKE_DATABASE         = FNF     (기본값)
 *   SNOWFLAKE_SCHEMA           = PRCS    (기본값)
 */

import snowflake from 'snowflake-sdk';
import fs from 'fs';
import path from 'path';

const ACCOUNT   = process.env.SNOWFLAKE_ACCOUNT   || 'gv28284.ap-northeast-2.aws';
const USER      = process.env.SNOWFLAKE_USER       || '';
const WAREHOUSE = process.env.SNOWFLAKE_WAREHOUSE  || 'DEV_WH';
const DATABASE  = process.env.SNOWFLAKE_DATABASE   || 'FNF';
const SCHEMA    = process.env.SNOWFLAKE_SCHEMA     || 'PRCS';

/**
 * PEM 문자열 정규화
 * Vercel 환경변수는 다음 중 하나로 저장될 수 있음:
 *  - 실제 줄바꿈 (\n 문자)
 *  - 이스케이프된 \n (백슬래시+n 두 글자)
 *  - Windows CRLF (\r\n)
 */
function normalizePem(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')   // 이스케이프된 \n → 실제 줄바꿈
    .replace(/\r\n/g, '\n')  // CRLF → LF
    .replace(/\r/g, '\n')    // CR → LF
    .trim();
}

/** RSA 개인키 로드 (환경변수 직접 입력 또는 파일 경로) */
function loadPrivateKey(): string {
  let pem: string;

  // 1순위: 환경변수에 PEM 내용 직접 설정 (Vercel 클라우드 배포 시)
  if (process.env.SNOWFLAKE_PRIVATE_KEY) {
    pem = normalizePem(process.env.SNOWFLAKE_PRIVATE_KEY);
  } else {
    // 2순위: 파일 경로 (로컬 vercel dev)
    const keyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH || './snowflake_rsa_key.p8';
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
    pem = normalizePem(fs.readFileSync(resolved, 'utf8'));
  }

  // PEM 형식 기본 검증 및 진단 로그
  const hasBegin = pem.includes('-----BEGIN PRIVATE KEY-----');
  const hasEnd   = pem.includes('-----END PRIVATE KEY-----');
  console.log('[Snowflake] Key check: hasBegin=%s hasEnd=%s length=%d', hasBegin, hasEnd, pem.length);

  if (!hasBegin || !hasEnd) {
    throw new Error(
      `개인키 PEM 형식 오류: BEGIN=${hasBegin} END=${hasEnd} length=${pem.length} ` +
      `(환경변수 SNOWFLAKE_PRIVATE_KEY가 올바른 PKCS#8 PEM인지 확인하세요)`
    );
  }

  return pem;
}

/** 연결 풀 캐시 (서버리스 warm start 재사용) */
let pool: ReturnType<typeof snowflake.createPool> | null = null;

function getPool() {
  if (pool) return pool;
  pool = snowflake.createPool(
    {
      account: ACCOUNT,
      username: USER,
      warehouse: WAREHOUSE,
      database: DATABASE,
      schema: SCHEMA,
      authenticator: 'SNOWFLAKE_JWT',
      privateKey: loadPrivateKey(),
    },
    {
      min: 0,
      max: 3,
      acquireTimeoutMillis: 30000,
    }
  );
  return pool;
}

/** SQL 실행 → 객체 배열 반환 */
export async function querySnowflake(sql: string): Promise<Record<string, any>[]> {
  if (!USER) {
    throw new Error(
      'SNOWFLAKE_USER 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.'
    );
  }

  const conn = await getPool().acquire();
  try {
    return await new Promise((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        complete(err, _stmt, rows) {
          if (err) return reject(err);
          resolve((rows as Record<string, any>[]) || []);
        },
      });
    });
  } finally {
    await getPool().release(conn);
  }
}

/** 공통 JSON 응답 (CORS + Cache 헤더 포함) */
export function jsonResponse(res: any, data: any, status = 200) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(status).json(data);
}

/** 에러 응답 */
export function errorResponse(res: any, error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Snowflake API Error]', msg);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(500).json({ error: msg });
}
