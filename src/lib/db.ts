import { Pool, type PoolClient } from "pg";

const globalForPool = globalThis as typeof globalThis & { bizflowPool?: Pool };
const pool = globalForPool.bizflowPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== "production") globalForPool.bizflowPool = pool;

export async function withUserDb<T>(userId: string, work: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    await db.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    const result = await work(db);
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}