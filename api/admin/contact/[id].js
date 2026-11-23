
import { getPool } from '../../_lib/db.js';
import { json, method, originCheck } from '../../_lib/http.js';
import { getAdmin } from '../../_lib/auth.js';
import {
  normalizeGhanaPhone,
  cleanName,
  validName
} from '../../_lib/phone.js';

export default async function handler(req, res) {
  if (!method(req, res, ['PATCH', 'DELETE'])) return;

  if (!await getAdmin(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  if (!originCheck(req)) {
    return json(res, 403, { error: 'Request not allowed' });
  }

  const id = req.query.id;
  const pool = getPool();

  try {
    // DELETE CONTACT
    if (req.method === 'DELETE') {
      const result = await pool.query(
        `DELETE FROM contacts
         WHERE id = $1
         RETURNING id`,
        [id]
      );

      return result.rowCount
        ? json(res, 200, { ok: true })
        : json(res, 404, { error: 'Contact not found.' });
    }

    // UPDATE CONTACT
    const name = cleanName(req.body?.fullName);
    const phone = normalizeGhanaPhone(req.body?.phone);

    if (!validName(name)) {
      return json(res, 400, {
        error: 'Enter a valid full name.'
      });
    }

    if (!phone) {
      return json(res, 400, {
        error: 'Enter a valid Ghanaian mobile number.'
      });
    }

    const vcfName = `${name} L100`;

    const result = await pool.query(
      `UPDATE contacts
       SET
         full_name = $2,
         whatsapp = $3,
         level = $4,
         vcf_name = $5,
         updated_at = NOW()
       WHERE id = $1
       RETURNING
         id,
         full_name,
         whatsapp AS phone,
         level,
         vcf_name,
         created_at,
         updated_at`,
      [id, name, phone, 'Level 100', vcfName]
    );

    return result.rowCount
      ? json(res, 200, { contact: result.rows[0] })
      : json(res, 404, { error: 'Contact not found.' });

  } catch (e) {
    if (e.code === '23505') {
      return json(res, 409, {
        error: 'Another contact already uses this name or number.'
      });
    }

    console.error('Contact update error:', e);

    return json(res, 500, {
      error: 'Unable to update contact.'
    });
  }
}
