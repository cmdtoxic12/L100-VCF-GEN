import { normalizePhone, toE164 } from './_phone.js'

/** vCard 3.0 text escaping: backslash, newlines, and the value separators. */
function escapeValue(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/([,;])/g, '\\$1')
}

/** Split a full name into Family;Given for the structured N property. */
function splitName(fullName) {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { family: String(fullName ?? '').trim(), given: '' }
  const family = parts.pop()
  return { family, given: parts.join(' ') }
}

/**
 * Build a vCard 3.0 document from contact rows.
 * Phones are exported in E.164 so they stay dialable outside Ghana.
 */
export function buildVCF(contacts) {
  const cards = []

  for (const contact of contacts ?? []) {
    const name = String(contact?.full_name ?? '').trim()
    if (!name) continue

    const local = normalizePhone(contact?.whatsapp)
    const tel = local ? toE164(local) : String(contact?.whatsapp ?? '').replace(/[^\d+]/g, '')
    const level = String(contact?.level ?? 'L100').trim() || 'L100'
    const { family, given } = splitName(name)

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'PRODID:-//L100 Contacts//EN',
      `FN:${escapeValue(name)}`,
      `N:${escapeValue(family)};${escapeValue(given)};;;`,
      tel ? `TEL;TYPE=CELL:${escapeValue(tel)}` : null,
      `ORG:${escapeValue('College Level 100')}`,
      `NOTE:${escapeValue(`${level} · ${tel || 'no number'}`)}`,
      `CATEGORIES:${escapeValue(level)},Classmate`,
      'END:VCARD',
    ].filter(Boolean)

    cards.push(lines.join('\r\n') + '\r\n')
  }

  return cards.join('')
}
