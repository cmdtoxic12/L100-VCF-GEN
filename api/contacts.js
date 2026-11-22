import { getSQL } from './_db.js'
import { requireAdmin } from './_auth.js'
import {
  cleanText,
  clientKey,
  describeUniqueViolation,
  methodNotAllowed,
  parseBody,
  sendError,
  sendServerError,
} from './_http.js'
import { normalizePhone } from './_phone.js'
import { rateLimit } from './_rate-limit.js'

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

function intParam(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function likePattern(value) {
  return `%${value.replace(/[\\%_]/g, (match) => `\\${match}`)}%`
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  // GET — admin-only, paginated list with optional server-side search.
  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return

    try {
      const sql = getSQL()
      const limit = intParam(req.query?.limit, DEFAULT_LIMIT, 1, MAX_LIMIT)
      const offset = intParam(req.query?.offset, 0, 0, 100_000)
      // Truncate first so an oversized query is not rejected outright.
      const query =
        cleanText(String(req.query?.q ?? '').slice(0, 80), { min: 0, max: 80 }) ?? ''
      const digits = query.replace(/\D/g, '')

      const params = []
      const clauses = []

      if (query) {
        params.push(likePattern(query))
        clauses.push(`full_name ILIKE $${params.length} ESCAPE '\\'`)

        if (digits) {
          params.push(`%${digits}%`)
          clauses.push(`whatsapp LIKE $${params.length}`)
        }
      }

      const where = clauses.length ? `WHERE ${clauses.join(' OR ')}` : ''

      const rows = await sql.query(
        `SELECT id, full_name, whatsapp, level, created_at
           FROM contacts
           ${where}
          ORDER BY created_at DESC, id DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      )

      const counted = await sql.query(
        `SELECT count(*)::int AS total FROM contacts ${where}`,
        params,
      )
      const total = counted[0]?.total ?? 0

      return res.status(200).json({ rows, total, limit, offset })
    } catch (err) {
      return sendServerError(res, err)
    }
  }

  // POST — public registration form.
  if (req.method === 'POST') {
    if (!rateLimit(`create:${clientKey(req)}`, 8, 60_000)) {
      return sendError(
        res,
        429,
        'Too many submissions just now. Please wait a minute and try again.',
      )
    }

    const body = parseBody(req)
    if (!body) return sendError(res, 400, 'Invalid request body.')

    // Honeypot: bots fill hidden fields. Accept silently, store nothing.
    if (String(body.website ?? '').trim()) return res.status(201).json({ ok: true })

    const name = cleanText(body.full_name, { min: 2, max: 100 })
    if (!name) return sendError(res, 400, 'Enter your full name (2 to 100 characters).')

    const phone = normalizePhone(body.whatsapp)
    if (!phone) {
      return sendError(res, 400, 'Enter a valid Ghana mobile number, for example 0244 123 456.')
    }

    try {
      const sql = getSQL()

      // No SELECT-then-INSERT: the unique index is the source of truth, so two
      // simultaneous submissions cannot both slip through.
      const inserted = await sql`
        INSERT INTO contacts (full_name, whatsapp, level)
        VALUES (${name}, ${phone}, 'L100')
        RETURNING id, full_name, whatsapp, level, created_at
      `

      const row = inserted[0]
      const sameName = await sql`
        SELECT 1
          FROM contacts
         WHERE lower(full_name) = lower(${name})
           AND id <> ${row.id}::uuid
         LIMIT 1
      `

      return res.status(201).json({ ...row, nameWarning: sameName.length > 0 })
    } catch (err) {
      if (err?.code === '23505') return sendError(res, 409, describeUniqueViolation(err))
      return sendServerError(res, err)
    }
  }

  return methodNotAllowed(res, ['GET', 'POST'])
}
