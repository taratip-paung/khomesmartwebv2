/**
 * Vite dev-only middleware: /api/solar/insights?lat=..&lng=..  → Google Solar API.
 * Reads SOLAR_SERVER_KEY from .env.local (NOT prefixed VITE_, so it is never sent to the browser).
 * The server key is IP-restricted to the office/home public IP, so this works from the Mac on that network.
 * Production uses the backend on the new CT (plan S2) with the same fetch/trim code.
 */
import { loadEnv } from 'vite'
import { fetchBuildingInsights } from '../src/lib/solar/insights.js'
import { createDailyLimiter } from '../src/lib/solar/dailyLimit.js'

const valid = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi

export default function solarDevApi() {
  let key = ''
  let limiter = createDailyLimiter({ limit: 300 })
  return {
    name: 'solar-dev-api',
    apply: 'serve',
    configResolved(cfg) {
      const env = loadEnv(cfg.mode, cfg.root, '')
      key = env.SOLAR_SERVER_KEY ?? ''
      limiter = createDailyLimiter({ limit: Number(env.SOLAR_DAILY_LIMIT) || 300 }) // SOLAR_DAILY_LIMIT=2 in .env.local to test the popup
    },
    configureServer(server) {
      server.middlewares.use('/api/solar/insights', async (req, res) => {
        const q = new URL(req.url, 'http://x').searchParams
        const lat = parseFloat(q.get('lat'))
        const lng = parseFloat(q.get('lng'))
        const send = (code, body) => {
          res.statusCode = code
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store') // Google policy: no caching of Solar API content
          res.end(JSON.stringify(body))
        }
        if (!key) return send(503, { found: false, reason: 'no_server_key' })
        if (!valid(lat, 5, 21) || !valid(lng, 97, 106)) return send(400, { found: false, reason: 'bad_location' }) // Thailand bbox
        // daily cap: every upstream call counts (Google bills per request)
        const slot = limiter.take()
        if (!slot.ok) return send(429, { found: false, reason: 'daily_limit', limit: slot.limit, resetsAt: slot.resetsAt })
        try {
          send(200, await fetchBuildingInsights({ lat, lng, key }))
        } catch (e) {
          server.config.logger.error(`[solar] ${e.message}`)
          send(502, { found: false, reason: 'upstream_error' })
        }
      })
    },
  }
}
