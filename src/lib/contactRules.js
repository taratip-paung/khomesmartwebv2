/**
 * Contact-form field rules — ONE source of truth, used by the browser form
 * (src/components/ContactForm.jsx) and the backend (server/contact-server.mjs).
 * Pure functions, no imports, so Node can load it as-is.
 *
 * Each check returns null when OK or an error key that maps to
 * ui.sections.contact.form.errors.<key> in src/i18n/strings.js.
 */
export const SERVICES = ['solar', 'rnd', 'network', 'cloud', 'other']

const digits = (s) => s.replace(/\D/g, '')

/** Thai mobile/landline: 9–10 digits (0xxxxxxxxx) or +66 form; dashes/spaces/dots allowed. */
export function isPhone(s) {
  const raw = s.trim()
  if (!/^\+?[\d\s\-.()]+$/.test(raw)) return false
  let d = digits(raw)
  if (raw.startsWith('+66') || d.startsWith('66')) d = '0' + d.replace(/^66/, '')
  return /^0\d{8,9}$/.test(d)
}

/** LINE ID: optional leading @, then 4–20 of a–z 0–9 . _ - (LINE's own rule). */
export function isLineId(s) {
  return /^@?[a-z0-9._-]{4,20}$/i.test(s.trim())
}

export function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

export function checkService(v) {
  return SERVICES.includes(v) ? null : 'service'
}
export function checkProject(v) {
  const s = v.trim()
  return s.length < 2 ? 'project' : s.length > 120 ? 'projectLong' : null
}
export function checkName(v) {
  const s = v.trim()
  return s.length < 2 ? 'name' : s.length > 80 ? 'nameLong' : null
}
/** Phone OR LINE ID. Anything that looks numeric is judged as a phone number. */
export function checkContact(v) {
  const s = v.trim()
  if (!s) return 'contact'
  if (/^\+?[\d\s\-.()]+$/.test(s)) return isPhone(s) ? null : 'phone'
  return isLineId(s) ? null : 'line'
}
export function checkEmail(v) {
  const s = v.trim()
  return !s ? null : s.length > 120 || !isEmail(s) ? 'email' : null
}
export function checkMessage(v) {
  return String(v ?? '').length > 1000 ? 'messageLong' : null
}

/** Validate a whole payload → { field: errorKey } (empty object = valid). */
export function validateContact(p) {
  const errs = {
    service: checkService(String(p.service ?? '')),
    project: checkProject(String(p.project ?? '')),
    name: checkName(String(p.name ?? '')),
    contact: checkContact(String(p.contact ?? '')),
    email: checkEmail(String(p.email ?? '')),
    message: checkMessage(p.message),
  }
  for (const k of Object.keys(errs)) if (!errs[k]) delete errs[k]
  return errs
}
