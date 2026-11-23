import { getPool } from '../_lib/db.js';
import { json, method, clientKey, rateLimit, originCheck } from '../_lib/http.js';
import { createSession, setSessionCookie } from '../_lib/auth.js';
import { timingSafeEqual, createHash } from 'node:crypto';
function safeEqual(a,b) { const x=createHash('sha256').update(String(a)).digest(); const y=createHash('sha256').update(String(b)).digest(); return timingSafeEqual(x,y); }
export default async function handler(req,res) {
  if (!method(req,res,['POST'])) return;
  if (!originCheck(req)) return json(res,403,{error:'Request not allowed'});
  try { const pool=getPool(); if(!await rateLimit(pool,`login:${clientKey(req)}`,8,15)) return json(res,429,{error:'Too many login attempts. Wait and try again.'});
    const username=String(req.body?.username||''); const password=String(req.body?.password||'');
    if(!process.env.ADMIN_USERNAME||!process.env.ADMIN_PASSWORD||!safeEqual(username,process.env.ADMIN_USERNAME)||!safeEqual(password,process.env.ADMIN_PASSWORD)) return json(res,401,{error:'Invalid username or password.'});
    const token=await createSession(username); setSessionCookie(res,token); return json(res,200,{ok:true});
  } catch(e) { console.error('Login error:',e); return json(res,500,{error:'Admin login is not configured correctly.'}); }
}
