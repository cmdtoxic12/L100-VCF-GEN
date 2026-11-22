import { getSQL } from '../_db.js'
import { requireAdmin } from '../_auth.js'
import { methodNotAllowed, sendServerError } from '../_http.js'
import { buildVCF } from '../_vcf.js'

const MAX_EXPORT = 5000

/**
 * Exports the whole contact list as a vCard, generated server-side so the
 * browser never has to page through every row.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])
  if (!requireAdmin(req, res)) return

  try {
    const rows = await getSQL()`
      SELECT full_name, whatsapp, level
        FROM contacts
       ORDER BY full_name ASC
       LIMIT ${MAX_EXPORT}
    `

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="L100_Contacts.vcf"')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    return res.status(200).send(buildVCF(rows))
  } catch (err) {
    return sendServerError(res, err)
  }
}
