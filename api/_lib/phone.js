export function normalizeGhanaPhone(input) {
  if (typeof input !== 'string') return null;
  let digits = input.trim().replace(/[\s().-]/g, '');
  if (!/^\+?\d+$/.test(digits)) return null;
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('233')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[25]\d{8}$/.test(digits)) return null;
  return `+233${digits}`;
}
export function cleanName(name) { return typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : ''; }
export function validName(name) { return name.length >= 2 && name.length <= 80 && /^[\p{L}\p{M} .'-]+$/u.test(name); }
