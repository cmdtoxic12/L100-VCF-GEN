import { getPool } from '../_lib/db.js';
import { json, method } from '../_lib/http.js';
import { getAdmin } from '../_lib/auth.js';
import { createVcf } from '../_lib/vcf.js';
export default async function handler(req,res) { if(!method(req,res,['GET'])) return; if(!await getAdmin(req)) return json(res,401,{error:'Unauthorized'}); try { const result=await getPool().query('SELECT full_name,phone,level,vcf_name FROM contacts ORDER BY full_name ASC'); const body=createVcf(result.rows); res.setHeader('Content-Type','text/vcard; charset=utf-8'); res.setHeader('Content-Disposition','attachment; filename="level-100-contacts.vcf"'); res.setHeader('Cache-Control','no-store'); return res.status(200).end(body); } catch(e) { console.error(e); return json(res,500,{error:'Unable to export contacts.'}); } }
