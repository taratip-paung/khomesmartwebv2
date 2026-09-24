/**
 * Daily cap on calls to Google Solar API (Google only offers per-minute quotas).
 * The day rolls over at local midnight (Asia/Bangkok, UTC+7 — no DST).
 * In-memory: fine for the dev server; the production backend (plan S2) keeps the same logic but
 * persists the counter in Postgres so a restart does not reset it.
 */
const TZ_OFFSET_MS = 7 * 3600 * 1000

export const bangkokDay = (t) => new Date(t + TZ_OFFSET_MS).toISOString().slice(0, 10)
/** epoch ms of the next Bangkok midnight */
export const nextBangkokMidnight = (t) => {
  const d = new Date(t + TZ_OFFSET_MS)
  d.setUTCHours(24, 0, 0, 0)
  return d.getTime() - TZ_OFFSET_MS
}

export function createDailyLimiter({ limit = 300, now = () => Date.now() } = {}) {
  let day = bangkokDay(now())
  let used = 0
  const roll = () => {
    const d = bangkokDay(now())
    if (d !== day) {
      day = d
      used = 0
    }
  }
  return {
    /** reserve one call; returns ok=false when today's cap is reached */
    take() {
      roll()
      if (used >= limit) return { ok: false, used, limit, resetsAt: nextBangkokMidnight(now()) }
      used += 1
      return { ok: true, used, limit, resetsAt: nextBangkokMidnight(now()) }
    },
    status() {
      roll()
      return { used, limit, day }
    },
  }
}
