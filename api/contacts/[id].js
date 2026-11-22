import { getSQL } from '../_db.js'

function normalizePhone(phone) {
  return String(phone || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/^\+233/, '0')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sql = getSQL()
    const { id } = req.query
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const name = String(body.full_name || '').trim()
    const phone = normalizePhone(body.whatsapp)

    if (!id || !name || !phone) {
      return res.status(400).json({ error: 'id, full_name and whatsapp are required.' })
    }

    // Optional: block update if new phone/name collides with someone else
    const phoneClash = await sql`
      SELECT id FROM contacts WHERE whatsapp = ${phone} AND id != ${id}::uuid LIMIT 1
    `
    if (phoneClash[0]) {
      return res.status(409).json({ error: 'This WhatsApp number is already used by another contact.' })
    }

    const nameClash = await sql`
      SELECT id FROM contacts WHERE lower(full_name) = lower(${name}) AND id != ${id}::uuid LIMIT 1
    `
    if (nameClash[0]) {
      return res.status(409).json({ error: 'This name is already used by another contact.' })
    }

    const updated = await sql`
      UPDATE contacts
      SET full_name = ${name}, whatsapp = ${phone}
      WHERE id = ${id}::uuid
      RETURNING id, full_name, whatsapp, level, created_at
    `

    if (!updated[0]) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    return res.status(200).json(updated[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
