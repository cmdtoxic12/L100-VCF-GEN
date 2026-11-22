/**
 * Fixed-window in-memory limiter.
 *
 * Serverless instances are short-lived and not shared, so this is a speed bump,
 * not a guarantee. Put Upstash/Redis or Vercel Firewall in front for real
 * protection against a determined spammer.
 */

const buckets = new Map()
const MAX_KEYS = 5000

export function rateLimit(key, limit, windowMs) {
  const now = Date.now()

  if (buckets.size > MAX_KEYS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) return false

  bucket.count += 1
  return true
}
