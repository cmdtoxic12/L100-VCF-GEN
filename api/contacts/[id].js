import { getSQL } from '../_db.js'
import { requireAdmin } from '../_auth.js'
import {
  cleanText,
  describeUniqueViolation,
  methodNotAllowed,
  parseBody,
  sendError,
  sendServerError,
} from '../_http.js'
import { normalizePhone } from '../_phone.js'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    return methodNotAllowed(res, ['PUT', 'DELETE'])
  }

  if (!requireAdmin(req, res)) return

  const id = String(req.query?.id ?? '')
  if (!UUID_PATTERN.test(id)) return sendError(res, 400, 'Invalid contact id.')

  if (req.method === 'DELETE') {
    try {
      const deleted = await getSQL()`
        DELETE FROM contacts
         WHERE id = ${id}::uuid
         RETURNING id
      `
      if (!deleted[0]) return sendError(res, 404, 'Contact not found.')
      return res.status(200).json({ ok: true, id: deleted[0].id })
    } catch (err) {
      return sendServerError(res, err)
    }
  }

  const body = parseBody(req)
  if (!body) return sendError(res, 400, 'Invalid request body.')

  const name = cleanText(body.full_name, { min: 2, max: 100 })
  if (!name) return sendError(res, 400, 'Enter a full name (2 to 100 characters).')

  const phone = normalizePhone(body.whatsapp)
  if (!phone) {
    return sendError(res, 400, 'Enter a valid Ghana mobile number, for example 0244 123 456.')
  }

  try {
    const updated = await getSQL()`
      UPDATE contacts
         SET full_name = ${name}, whatsapp = ${phone}
       WHERE id = ${id}::uuid
       RETURNING id, full_name, whatsapp, level, created_at
    `

    if (!updated[0]) return sendError(res, 404, 'Contact not found.')
    return res.status(200).json(updated[0])
  } catch (err) {
    if (err?.code === '23505') return sendError(res, 409, describeUniqueViolation(err))
    return sendServerError(res, err)
  }
}
