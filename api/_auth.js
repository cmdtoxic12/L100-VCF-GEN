import crypto from 'node:crypto'

const COOKIE_NAME = 'l100_admin'
const SESSION_HOURS = 8

function getSecret() {
  return process.env.ADMIN_SECRET?.trim() || ''
}

export function isAuthConfigured() {
  return Boolean(getSecret() && process.env.ADMIN_PASSWORD)
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

export function checkPassword(given) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return safeEqual(given ?? '', expected)
}

export function issueToken(hours = SESSION_HOURS) {
  const secret = getSecret()
  if (!secret) throw new Error('ADMIN_SECRET is not set')
  const expiresAt = String(Date.now() + hours * 3600_000)
  return `${expiresAt}.${sign(expiresAt, secret)}`
}

function readCookie(req, name) {
  if (req.cookies && typeof req.cookies === 'object') return req.cookies[name]

  const header = req.headers?.cookie
  if (typeof header !== 'string' || !header) return undefined

  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator).trim() !== name) continue
    return decodeURIComponent(part.slice(separator + 1).trim())
  }
  return undefined
}

export function isAdmin(req) {
  const secret = getSecret()
  if (!secret) return false

  const token = String(readCookie(req, COOKIE_NAME) ?? '')
  const [expiresAt, signature] = token.split('.')
  if (!expiresAt || !signature) return false
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) < Date.now()) return false

  return safeEqual(signature, sign(expiresAt, secret))
}

/** Returns false and writes a 401 when the caller is not an authenticated admin. */
export function requireAdmin(req, res) {
  if (isAdmin(req)) return true
  res.status(401).json({ error: 'Unauthorized. Sign in from the admin page.' })
  return false
}

export function setAdminCookie(res) {
  const parts = [
    `${COOKIE_NAME}=${issueToken()}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${SESSION_HOURS * 3600}`,
  ]
  // Secure on Vercel (https) and in any production build, but not on plain-http localhost.
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

export function clearAdminCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`,
  )
}
