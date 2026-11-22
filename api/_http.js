import { DbNotConfiguredError } from './_db.js'

/**
 * Replace C0/C1 control characters with spaces by code point.
 * Done this way rather than with a regex so the intent is explicit and
 * no-control-regex lint rules stay meaningful for the rest of the codebase.
 */
export function stripControl(value) {
  let output = ''
  for (const char of String(value ?? '')) {
    const code = char.codePointAt(0)
    output += code < 0x20 || (code >= 0x7f && code <= 0x9f) ? ' ' : char
  }
  return output
}

/**
 * Trim, collapse whitespace, strip control characters, and enforce a length.
 * Returns null when the value is missing or out of range.
 */
export function cleanText(value, { min = 1, max = 100 } = {}) {
  const text = stripControl(value).replace(/\s+/g, ' ').trim()

  if (text.length < min || text.length > max) return null
  return text
}

/** JSON body parser that tolerates Vercel's pre-parsed body and raw strings. */
export function parseBody(req) {
  try {
    if (req.body === undefined || req.body === null || req.body === '') return {}
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return null
  }
}

export function sendError(res, status, message) {
  return res.status(status).json({ error: message })
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '))
  return sendError(res, 405, 'Method not allowed.')
}

export function sendServerError(res, err) {
  if (err instanceof DbNotConfiguredError) {
    return sendError(
      res,
      503,
      'The contact list is temporarily unavailable. Please try again later.',
    )
  }

  // Log the detail server-side only; never echo database internals to clients.
  console.error('[api]', err)
  return sendError(res, 500, 'Something went wrong. Please try again.')
}

/** Best-effort client identifier for the in-memory rate limiter. */
export function clientKey(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded) && forwarded.length) return String(forwarded[0])
  return req.socket?.remoteAddress ?? 'unknown'
}

/** Map a Postgres unique-violation to a user-safe conflict message. */
export function describeUniqueViolation(err) {
  const constraint = String(err?.constraint ?? '')
  if (constraint.includes('whatsapp')) {
    return 'That WhatsApp number is already registered.'
  }
  if (constraint.includes('fullname') || constraint.includes('full_name')) {
    return 'Someone with that name is already registered. Add a middle name so you can be told apart.'
  }
  return 'That contact is already registered.'
}
