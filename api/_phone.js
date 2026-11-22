/**
 * Ghana mobile numbers, canonicalised to the local form: 0XXXXXXXXX.
 *
 * Accepted inputs (all map to 0244123456):
 *   0244123456 · 0244 123 456 · 0244-123-456
 *   +233244123456 · 233244123456 · 00233244123456 · +233 24 412 3456
 */

const LOCAL_MOBILE = /^0[235]\d{8}$/

/** Returns the canonical local number, or null when the input is not a Ghana mobile. */
export function normalizePhone(input) {
  let digits = String(input ?? '').replace(/[^\d+]/g, '')

  if (digits.startsWith('+233')) digits = '0' + digits.slice(4)
  else if (digits.startsWith('00233')) digits = '0' + digits.slice(5)
  else if (digits.startsWith('233') && digits.length === 12) digits = '0' + digits.slice(3)
  else if (digits.startsWith('+')) return null

  return LOCAL_MOBILE.test(digits) ? digits : null
}

/** Local form -> E.164 (+233...), which is what contacts should be exported as. */
export function toE164(local) {
  const clean = normalizePhone(local)
  return clean ? `+233${clean.slice(1)}` : ''
}

/** 0244123456 -> "0244 123 456" for display. Falls back to the raw value. */
export function formatPhone(input) {
  const clean = normalizePhone(input)
  if (!clean) return String(input ?? '')
  return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`
}
