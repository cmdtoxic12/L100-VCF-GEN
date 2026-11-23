export function json(res, status, body) { res.status(status).setHeader('Content-Type','application/json; charset=utf-8').end(JSON.stringify(body)); }
export function method(req, res, allowed) { if (!allowed.includes(req.method)) { res.setHeader('Allow', allowed.join(', ')); json(res, 405, { error: 'Method not allowed' }); return false; } return true; }
export function clientKey(req) { const forwarded = req.headers['x-forwarded-for']; return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() || req.socket?.remoteAddress || 'unknown'; }
export async function rateLimit(pool, key, limit, windowMinutes) {
  const windowMs = windowMinutes * 60 * 1000;
  const result = await pool.query(`INSERT INTO api_rate_limits(key,hits,window_start) VALUES($1,1,now()) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN api_rate_limits.window_start < now() - ($2 * interval '1 minute') THEN 1 ELSE api_rate_limits.hits + 1 END, window_start=CASE WHEN api_rate_limits.window_start < now() - ($2 * interval '1 minute') THEN now() ELSE api_rate_limits.window_start END RETURNING hits`, [key, windowMinutes]);
  return Number(result.rows[0].hits) <= limit;
}
export function originCheck(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients; request validation still applies
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
