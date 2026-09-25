/**
 * Fastify app — built without listening so tests can use app.inject().
 *
 * Routes (HAProxy forwards the full path, so the prefix stays):
 *   GET /api/solar/health              → { ok, db, daily: {used, limit, day} }
 *   GET /api/solar/insights?lat&lng    → trimmed Google buildingInsights (same payload as the Vite dev middleware)
 *
 * Safety/cost guards on /insights, in order: peer must be HAProxy → Thailand bbox → 20/IP/hour → 300/day (Postgres).
 * Privacy: user coordinates are never logged (house location = personal data); Solar API content is never stored.
 */
import Fastify from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { isIP } from 'node:net'
import { fetchBuildingInsights } from '../../src/lib/solar/insights.js'

export const VERSION = '0.1.0'
const valid = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi
const bare = (a = '') => a.replace(/^::ffff:/, '')

/** real client IP: Cloudflare's header (set at the edge), else first X-Forwarded-For hop, else socket */
export function clientIp(req) {
  const cf = String(req.headers['cf-connecting-ip'] ?? '').trim()
  if (isIP(cf)) return cf
  const xff = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
  if (isIP(xff)) return xff
  return bare(req.socket.remoteAddress)
}

/**
 * @param {object} o
 * @param {ReturnType<import('./config.mjs').readConfig>} o.config
 * @param {{take():Promise<object>, status():Promise<object>}} o.limiter   daily cap (Postgres in prod)
 * @param {() => Promise<void>} o.dbPing
 * @param {typeof fetch} [o.fetchImpl]
 * @param {boolean|object} [o.logger]
 */
export async function buildApp({ config, limiter, dbPing, fetchImpl = fetch, logger = true }) {
  const app = Fastify({
    logger: logger && {
      level: process.env.LOG_LEVEL || 'info',
      // path only — the query string holds the user's coordinates
      serializers: { req: (r) => ({ method: r.method, url: r.url.split('?')[0] }) },
    },
    bodyLimit: 16 * 1024,
  })

  const trusted = new Set(config.trustedProxies.map(bare))

  app.addHook('onRequest', async (req, reply) => {
    reply.header('Cache-Control', 'no-store') // Google policy: Solar API content must not be cached
    reply.header('X-Content-Type-Options', 'nosniff')
    // only HAProxy (and localhost) may reach the API; /health stays open on the LAN for monitoring
    if (!req.url.startsWith('/api/solar/health') && !trusted.has(bare(req.socket.remoteAddress))) {
      return reply.code(403).send({ found: false, reason: 'forbidden' })
    }
  })

  await app.register(rateLimit, { global: false })

  app.get('/api/solar/health', async (req, reply) => {
    try {
      await dbPing()
      return { ok: true, version: VERSION, db: true, daily: await limiter.status() }
    } catch (e) {
      req.log.error({ err: e.message }, 'health: db down')
      return reply.code(503).send({ ok: false, version: VERSION, db: false })
    }
  })

  app.get(
    '/api/solar/insights',
    {
      config: {
        rateLimit: {
          max: config.ipHourly,
          timeWindow: '1 hour',
          keyGenerator: clientIp,
          errorResponseBuilder: (req, ctx) => ({
            statusCode: 429,
            found: false,
            reason: 'rate_limited',
            retryAfterSec: Math.ceil(ctx.ttl / 1000),
          }),
        },
      },
    },
    async (req, reply) => {
      const lat = parseFloat(req.query.lat)
      const lng = parseFloat(req.query.lng)
      if (!config.key) return reply.code(503).send({ found: false, reason: 'no_server_key' })
      if (!valid(lat, 5, 21) || !valid(lng, 97, 106)) return reply.code(400).send({ found: false, reason: 'bad_location' }) // Thailand bbox

      let slot
      try {
        slot = await limiter.take() // every upstream call counts — Google bills per request
      } catch (e) {
        req.log.error({ err: e.message }, 'daily limiter failed (db?)')
        return reply.code(503).send({ found: false, reason: 'unavailable' }) // fail closed: no cap → no call
      }
      if (!slot.ok) {
        req.log.warn({ limit: slot.limit }, 'daily limit reached')
        return reply.code(429).send({ found: false, reason: 'daily_limit', limit: slot.limit, resetsAt: slot.resetsAt })
      }

      try {
        const out = await fetchBuildingInsights({ lat, lng, key: config.key, fetchImpl, signal: AbortSignal.timeout(10_000) })
        if (out.reason === 'api_error') req.log.error({ status: out.status, msg: out.message }, 'solar api error')
        else req.log.info({ found: out.found, used: slot.used }, 'insights')
        const { status, message, ...safe } = out // don't pass Google's error text to the browser
        return safe
      } catch (e) {
        req.log.error({ err: e.message }, 'solar api fetch failed')
        return reply.code(502).send({ found: false, reason: 'upstream_error' })
      }
    },
  )

  app.setNotFoundHandler((req, reply) => reply.code(404).send({ found: false, reason: 'not_found' }))
  return app
}
