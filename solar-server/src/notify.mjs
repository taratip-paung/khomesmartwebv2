/**
 * S2.5 — backend alerts to Telegram (same bot + group as the contact form: server/.env on the Mac).
 * Throttled per alert key so a burst of the same error sends ONE message; the next one after the
 * window says how many were suppressed. Never includes user coordinates or IPs (PDPA).
 * Fire-and-forget: a Telegram outage must never slow down or break a user request.
 */
import os from 'node:os'

const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c])

export function createNotifier({
  token,
  chatId,
  fetchImpl = fetch,
  now = () => Date.now(),
  throttleMs = 15 * 60_000,
  log = console,
  host = os.hostname(),
} = {}) {
  const enabled = Boolean(token && chatId)
  const last = new Map() // key → { at, suppressed }

  async function send(text) {
    const r = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!r.ok) throw new Error(`telegram ${r.status}`)
  }

  return {
    enabled,
    /**
     * @param {string} key   throttle bucket, e.g. 'google_api_error'
     * @param {string} text  plain text (escaped here)
     * @param {{throttleMs?: number}} [o]
     * @returns {Promise<boolean>} true if a message was sent
     */
    async alert(key, text, o = {}) {
      if (!enabled) return false
      const t = now()
      const win = o.throttleMs ?? throttleMs
      const prev = last.get(key)
      if (prev && t - prev.at < win) {
        prev.suppressed += 1
        return false
      }
      const extra = prev?.suppressed ? `\n(+${prev.suppressed} ครั้งที่ไม่ได้แจ้งในช่วงก่อนหน้า)` : ''
      last.set(key, { at: t, suppressed: 0 })
      const when = new Date(t).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
      const msg = `⚠️ <b>Solar Builder backend</b> · ${esc(host)}\n${esc(text)}${esc(extra)}\n<i>${when}</i>`
      try {
        await send(msg)
        return true
      } catch (e) {
        log.warn?.({ err: e.message }, 'telegram alert failed')
        return false
      }
    },
  }
}

export const noopNotifier = { enabled: false, alert: async () => false }
