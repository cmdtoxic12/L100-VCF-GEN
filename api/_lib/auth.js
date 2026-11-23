import { SignJWT, jwtVerify } from 'jose';
const cookieName = 'vcf_admin_session';
function secret() { const value = process.env.SESSION_SECRET || ''; if (value.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters'); return new TextEncoder().encode(value); }
export async function createSession(username) { return new SignJWT({ role: 'admin', username }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').setIssuer('vcf-registry').sign(secret()); }
export async function getAdmin(req) { const cookie = req.headers.cookie || ''; const token = cookie.split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1); if (!token) return null; try { const { payload } = await jwtVerify(decodeURIComponent(token), secret(), { issuer: 'vcf-registry' }); return payload.role === 'admin' ? payload : null; } catch { return null; } }
export function setSessionCookie(res, token) { const secure = process.env.COOKIE_SECURE !== '0'; res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure ? '; Secure' : ''}`); }
export function clearSessionCookie(res) { const secure = process.env.COOKIE_SECURE !== '0'; res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`); }
