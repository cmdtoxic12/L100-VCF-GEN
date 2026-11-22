import { getSQL } from './_db.js'

function normalizePhone(phone) {
  return String(phone || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/^\+233/, '0')
}

export default async function handler(req, res) {
  // CORS for local/dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const sql = getSQL()

    // ── GET: last 10 contacts ──
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, full_name, whatsapp, level, created_at
        FROM contacts
        ORDER BY created_at DESC
        LIMIT 10
      `
      return res.status(200).json(rows)
    }

    // ── POST: create with duplicate check ──
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const name = String(body.full_name || '').trim()
      const phone = normalizePhone(body.whatsapp)

      if (!name || !phone) {
        return res.status(400).json({ error: 'Full name and WhatsApp number are required.' })
      }

      // Duplicate checks
      const byPhone = await sql`
        SELECT id, full_name, whatsapp FROM contacts WHERE whatsapp = ${phone} LIMIT 1
      `
      const byName = await sql`
        SELECT id, full_name, whatsapp FROM contacts WHERE lower(full_name) = lower(${name}) LIMIT 1
      `

      const phoneMatch = byPhone[0]
      const nameMatch = byName[0]

      if (phoneMatch && nameMatch && phoneMatch.id === nameMatch.id) {
        return res.status(409).json({ error: 'This name and number are already registered.' })
      }
      if (phoneMatch) {
        return res.status(409).json({
          error: `This WhatsApp number is already registered under "${phoneMatch.full_name}".`,
        })
      }
      if (nameMatch) {
        return res.status(409).json({
          error: `The name "${name}" is already registered with a different number.`,
        })
      }

      const inserted = await sql`
        INSERT INTO contacts (full_name, whatsapp, level)
        VALUES (${name}, ${phone}, 'L100')
        RETURNING id, full_name, whatsapp, level, created_at
      `

      return res.status(201).json(inserted[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
