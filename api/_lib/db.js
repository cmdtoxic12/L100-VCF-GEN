import { Pool } from '@neondatabase/serverless';
let pool;
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return pool;
}
export async function ensureRateTable() {
  await getPool().query(`CREATE TABLE IF NOT EXISTS api_rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL DEFAULT 0, window_start TIMESTAMPTZ NOT NULL DEFAULT now())`);
}
