/**
 * Contact-form backend — receives POST /api/contact and forwards it to Telegram.
 * Zero dependencies (Node 20+: built-in http + fetch).
 *
 *   TELEGRAM_BOT_TOKEN   bot token from @BotFather            (required)
 *   TELEGRAM_CHAT_ID     chat / group id to notify            (required)
 *   PORT                 default 8787 (binds 127.0.0.1 only; nginx proxies /api/)
 *   RATE_LIMIT           submissions per IP per hour, default 5
 *
 * Run:  node server/contact-server.mjs        (reads server/.env if present)
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateContact } from '../src/lib/contactRules.js' // same rules as the browser form

// --- tiny .env loader (no dotenv dependency) ---
const here = path.dirname(fileURLToPath(import.meta.url))
const envFile = path.join(here, '.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID
const PORT = Number(process.env.PORT || 8787)
const RATE_LIMIT = Number(process.env.RATE_LIMIT || 5)
const DRY_RUN = process.env.DRY_RUN === '1' // log instead of calling Telegram (local testing)
if (!DRY_RUN && (!TOKEN || !CHAT_ID)) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID (server/.env)')
  process.exit(1)
}

const SERVICE_LABEL = { solar: 'Solar Rooftop', rnd: 'IoT & R&D', network: 'Network', cloud: 'Cloud & Hosting', other: 'Other' }

// --- rate limit: per IP, sliding hour ---
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter((t) => now - t < 3600_000)
  if (arr.length >= RATE_LIMIT) return true
  arr.push(now)
  hits.set(ip, arr)
  return false
}
setInterval(() => {
  const now = Date.now()
  for (const [ip, arr] of hits) if (!arr.some((t) => now - t < 3600_000)) hits.delete(ip)
}, 600_000).unref()

const clean = (v, max) => String(v ?? '').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, ' ').trim().slice(0, max)
const esc = (s) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))

function validate(body) {
  const data = {
    service: clean(body.service, 20),
    project: clean(body.project, 200),
    name: clean(body.name, 200),
    contact: clean(body.contact, 80),
    email: clean(body.email, 200),
    message: clean(body.message, 2000),
  }
  const fields = validateContact(data) // { field: errorKey } — same keys the form shows
  return { ok: Object.keys(fields).length === 0, fields, data }
}

function formatMessage(d, ip, lang) {
  return [
    '\u{1F514} <b>New enquiry — beconnectedcm.com</b>',
    '',
    `<b>Type:</b> ${esc(SERVICE_LABEL[d.service])}`,
    `<b>Project:</b> ${esc(d.project)}`,
    `<b>Name:</b> ${esc(d.name)}`,
    `<b>Contact:</b> ${esc(d.contact)}`,
    d.email ? `<b>Email:</b> ${esc(d.email)}` : null,
    d.message ? `\n<b>Details:</b>\n${esc(d.message)}` : null,
    '',
    `<i>${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} · ${lang} · ${ip}</i>`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

async function notify(d, ip, lang) {
  const text = formatMessage(d, ip, lang)
  if (DRY_RUN) return console.log('[dry-run] would send:\n' + text)
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!r.ok) throw new Error(`telegram ${r.status}: ${await r.text()}`)
}

function json(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(obj))
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  if (req.method === 'GET' && url === '/api/health') return json(res, 200, { ok: true })
  if (req.method !== 'POST' || url !== '/api/contact') return json(res, 404, { ok: false })

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress
  let raw = ''
  req.on('data', (c) => {
    raw += c
    if (raw.length > 20_000) req.destroy()
  })
  req.on('end', async () => {
    let body
    try {
      body = JSON.parse(raw || '{}')
    } catch {
      return json(res, 400, { ok: false, error: 'bad_json' })
    }

    // spam gates: honeypot filled, or submitted < 3 s after the form opened → pretend success
    const elapsed = Date.now() - Number(body.startedAt || 0)
    if (body.website || !(elapsed > 3000 && elapsed < 6 * 3600_000)) return json(res, 200, { ok: true })

    if (limited(ip)) return json(res, 429, { ok: false, error: 'rate_limited' })
    const v = validate(body)
    if (!v.ok) return json(res, 400, { ok: false, error: 'invalid', fields: v.fields })
    try {
      await notify(v.data, ip, clean(body.lang, 5) || 'en')
      console.log(new Date().toISOString(), 'enquiry', ip, v.data.service, JSON.stringify(v.data.project))
      json(res, 200, { ok: true })
    } catch (e) {
      console.error(new Date().toISOString(), 'telegram failed', e.message)
      json(res, 502, { ok: false, error: 'notify_failed' })
    }
  })
})

server.listen(PORT, '127.0.0.1', () => console.log(`contact-server listening on 127.0.0.1:${PORT}`))
