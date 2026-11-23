import { getPool } from './_lib/db.js';
import { json, method, clientKey, rateLimit, originCheck } from './_lib/http.js';
import { normalizeGhanaPhone, cleanName, validName } from './_lib/phone.js';
export default async function handler(req, res) {
  if (!method(req,res,['POST'])) return;
  if (!originCheck(req)) return json(res,403,{error:'Request not allowed'});
  let client;
  try {
    const pool=getPool(); const ip=clientKey(req);
    if (!await rateLimit(pool,`submit:${ip}`,12,10)) return json(res,429,{error:'Too many submissions. Please try again later.'});
    const name=cleanName(req.body?.fullName); const phone=normalizeGhanaPhone(req.body?.phone);
    if (!validName(name)) return json(res,400,{error:'Enter a valid full name (2–80 characters).'});
    if (!phone) return json(res,400,{error:'Enter a valid Ghanaian mobile number.'});
    client=await pool.connect(); await client.query('BEGIN');
    // Serialize registrations so the 350-contact cap cannot be exceeded during concurrent submissions.
    await client.query('SELECT pg_advisory_xact_lock(100350)');
    const duplicate = await client.query(
  `SELECT id FROM contacts
   WHERE lower(trim(full_name)) = lower(trim($1))
   OR whatsapp = $2
   LIMIT 1`,
  [name, phone]
);
    if (duplicate.rows.length) { await client.query('ROLLBACK'); return json(res,409,{error:'This name or WhatsApp number is already registered.'}); }
    const count=await client.query('SELECT count(*)::int AS count FROM contacts');
    if (count.rows[0].count>=350) { await client.query('ROLLBACK'); return json(res,409,{error:'Registration is full. The 350-contact limit has been reached.'}); }
    const vcfName=`${name} L100`;
    const result = await client.query(
  `INSERT INTO contacts (full_name, whatsapp, level, vcf_name)
   VALUES ($1, $2, $3, $4)
   RETURNING id, full_name, whatsapp AS phone,
   level, vcf_name, created_at`,
  [name, phone, 'Level 100', vcfName]
);
    await client.query('COMMIT'); return json(res,201,{message:'Registration successful!',contact:result.rows[0]});
  } catch (e) { if(client) { try { await client.query('ROLLBACK'); } catch {} } if(e.code==='23505') return json(res,409,{error:'This name or WhatsApp number is already registered.'}); console.error('Submit error:',e); return json(res,500,{error:'We could not save your registration. Please try again.'}); }
  finally { if(client) client.release(); }
}
