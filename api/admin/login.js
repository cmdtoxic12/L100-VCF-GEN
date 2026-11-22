import {
  checkPassword,
  clearAdminCookie,
  isAdmin,
  isAuthConfigured,
  setAdminCookie,
} from '../_auth.js'
import { clientKey, methodNotAllowed, parseBody, sendError } from '../_http.js'
import { rateLimit } from '../_rate-limit.js'

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    return res.status(200).json({
      authenticated: isAdmin(req),
      configured: isAuthConfigured(),
    })
  }

  if (req.method === 'POST') {
    if (!isAuthConfigured()) {
      return sendError(
        res,
        503,
        'Admin access is not configured. Set ADMIN_PASSWORD and ADMIN_SECRET.',
      )
    }

    if (!rateLimit(`login:${clientKey(req)}`, 10, 5 * 60_000)) {
      return sendError(res, 429, 'Too many attempts. Please try again in a few minutes.')
    }

    const body = parseBody(req)
    if (!body) return sendError(res, 400, 'Invalid request body.')

    if (!checkPassword(body.password)) {
      return sendError(res, 401, 'Incorrect password.')
    }

    setAdminCookie(res)
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    clearAdminCookie(res)
    return res.status(200).json({ ok: true })
  }

  return methodNotAllowed(res, ['GET', 'POST', 'DELETE'])
}
