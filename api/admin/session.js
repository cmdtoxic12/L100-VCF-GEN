import { json, method } from '../_lib/http.js';
import { getAdmin, clearSessionCookie } from '../_lib/auth.js';
export default async function handler(req,res) { if(!method(req,res,['GET','DELETE'])) return; if(req.method==='GET') { const admin=await getAdmin(req); return json(res,200,{authenticated:!!admin,username:admin?.username||null}); } clearSessionCookie(res); return json(res,200,{ok:true}); }
