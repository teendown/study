// ===========================
// Turso + Drizzle 클라이언트
// ===========================

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

/**
 * Turso 클라이언트를 생성합니다.
 * 환경변수가 설정되어 있어야 합니다.
 */
function createTursoClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.'
    );
  }

  return createClient({
    url,
    authToken,
  });
}

/**
 * Drizzle ORM 인스턴스 (스키마 타입 추론 포함)
 *
 * 사용법:
 * ```ts
 * import { getDb } from '@/lib/db/client';
 * const db = getDb();
 * const users = await db.select().from(schema.users);
 * ```
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const client = createTursoClient();
    _db = drizzle(client, { schema });
  }
  return _db;
}

/** 스키마 타입을 편리하게 사용하기 위해 re-export */
export { schema };
