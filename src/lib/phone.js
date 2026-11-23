export function normalizePhone(value) {
  let digits = String(value || '').trim().replace(/[\s().-]/g, '');
  if (!/^\+?\d+$/.test(digits)) return null;
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('233')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return /^[25]\d{8}$/.test(digits) ? `+233${digits}` : null;
}
export function formatLocalPhone(value) { return String(value || '').replace(/\D/g,'').replace(/^233/, '').replace(/^0/, '').slice(0,9); }
