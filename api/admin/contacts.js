import { getPool } from '../_lib/db.js';
import { json, method } from '../_lib/http.js';
import { getAdmin } from '../_lib/auth.js';
export default async function handler(req,res) { if(!method(req,res,['GET'])) return; if(!await getAdmin(req)) return json(res,401,{error:'Unauthorized'}); try { const pool=getPool(); 
    const result = await pool.query(`
  SELECT
    id,
    full_name,
    whatsapp AS phone,
    level,
    vcf_name,
    created_at,
    updated_at
  FROM contacts
  ORDER BY created_at DESC
  LIMIT 10
`); 
    const count=await pool.query('SELECT count(*)::int AS count FROM contacts'); return json(res,200,{contacts:result.rows,total:count.rows[0].count,capacity:350}); } catch(e) { console.error(e); return json(res,500,{error:'Unable to load contacts.'}); } }
