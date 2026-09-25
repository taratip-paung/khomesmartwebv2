import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp, clientIp } from '../src/app.mjs'
import { readConfig } from '../src/config.mjs'
import { createDailyLimiter } from '../../src/lib/solar/dailyLimit.js'

const CM = { lat: 18.7883, lng: 98.9853 } // Chiang Mai
const googleOk = {
  center: { latitude: CM.lat, longitude: CM.lng },
  imageryQuality: 'BASE',
  imageryDate: { year: 2025, month: 2, day: 18 },
  solarPotential: {
    maxArrayPanelsCount: 20,
    panelCapacityWatts: 400,
    maxSunshineHoursPerYear: 1900,
    roofSegmentStats: [{ azimuthDegrees: 180, pitchDegrees: 20, stats: { areaMeters2: 50, sunshineQuantiles: [1500, 1800, 1900] } }],
  },
}
const res = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body })

async function make({ env = {}, fetchImpl, limiter, dbPing = async () => {} } = {}) {
  const config = readConfig({ SOLAR_SERVER_KEY: 'test-key', ...env })
  const calls = []
  const f = fetchImpl ?? (async (url) => (calls.push(url), res(200, googleOk)))
  const app = await buildApp({ config, limiter: limiter ?? wrap(createDailyLimiter({ limit: config.dailyLimit })), dbPing, fetchImpl: f, logger: false })
  return { app, calls }
}
const wrap = (l) => ({ take: async () => l.take(), status: async () => l.status() })
const q = (p = CM) => `/api/solar/insights?lat=${p.lat}&lng=${p.lng}`

test('insights: trimmed payload, key only sent upstream, no-store', async () => {
  const { app, calls } = await make()
  const r = await app.inject(q())
  assert.equal(r.statusCode, 200)
  const j = r.json()
  assert.equal(j.found, true)
  assert.equal(j.maxKwp, 8)
  assert.equal(j.segments[0].azimuth, 180)
  assert.equal(r.headers['cache-control'], 'no-store')
  assert.ok(!r.body.includes('test-key'))
  assert.match(calls[0], /requiredQuality=BASE/)
})

test('insights: 404 from Google → found:false no_coverage', async () => {
  const { app } = await make({ fetchImpl: async () => res(404, {}) })
  const j = (await app.inject(q())).json()
  assert.deepEqual(j, { found: false, reason: 'no_coverage' })
})

test('insights: Google error text is not passed to the browser', async () => {
  const { app } = await make({ fetchImpl: async () => res(403, { error: { message: 'API key not valid for IP 1.2.3.4' } }) })
  const r = await app.inject(q())
  assert.deepEqual(r.json(), { found: false, reason: 'api_error' })
})

test('insights: network failure → 502 upstream_error', async () => {
  const { app } = await make({ fetchImpl: async () => { throw new Error('ECONNRESET') } })
  const r = await app.inject(q())
  assert.equal(r.statusCode, 502)
  assert.equal(r.json().reason, 'upstream_error')
})

test('insights: outside Thailand → 400, and does not use the daily budget', async () => {
  const { app, calls } = await make({ env: { SOLAR_DAILY_LIMIT: '1' } })
  assert.equal((await app.inject(q({ lat: 35.68, lng: 139.69 }))).statusCode, 400)
  assert.equal((await app.inject('/api/solar/insights?lat=abc&lng=1')).statusCode, 400)
  assert.equal((await app.inject(q())).statusCode, 200) // the one allowed call is still available
  assert.equal(calls.length, 1)
})

test('insights: no key → 503', async () => {
  const { app } = await make({ env: { SOLAR_SERVER_KEY: '' } })
  assert.equal((await app.inject(q())).json().reason, 'no_server_key')
})

test('insights: daily cap → 429 daily_limit (frontend shows LimitModal)', async () => {
  const { app, calls } = await make({ env: { SOLAR_DAILY_LIMIT: '2', SOLAR_IP_HOURLY: '100' } })
  await app.inject(q())
  await app.inject(q())
  const r = await app.inject(q())
  assert.equal(r.statusCode, 429)
  assert.equal(r.json().reason, 'daily_limit')
  assert.equal(typeof r.json().resetsAt, 'number')
  assert.equal(calls.length, 2)
})

test('insights: limiter failure fails closed (no Google call)', async () => {
  const { app, calls } = await make({ limiter: { take: async () => { throw new Error('db down') }, status: async () => ({}) } })
  const r = await app.inject(q())
  assert.equal(r.statusCode, 503)
  assert.equal(calls.length, 0)
})

test('insights: per-IP hourly limit, keyed on CF-Connecting-IP', async () => {
  const { app } = await make({ env: { SOLAR_IP_HOURLY: '2' } })
  const as = (ip) => app.inject({ url: q(), headers: { 'cf-connecting-ip': ip } })
  assert.equal((await as('203.0.113.5')).statusCode, 200)
  assert.equal((await as('203.0.113.5')).statusCode, 200)
  const r = await as('203.0.113.5')
  assert.equal(r.statusCode, 429)
  assert.equal(r.json().reason, 'rate_limited')
  assert.equal((await as('203.0.113.6')).statusCode, 200) // other visitor unaffected
})

test('only trusted proxy may call /insights; /health open on LAN', async () => {
  const { app } = await make()
  const r = await app.inject({ url: q(), remoteAddress: '10.10.13.99' })
  assert.equal(r.statusCode, 403)
  assert.equal((await app.inject({ url: q(), remoteAddress: '10.10.13.13' })).statusCode, 200)
  assert.equal((await app.inject({ url: '/api/solar/health', remoteAddress: '10.10.13.99' })).statusCode, 200)
})

test('health: reports db + daily usage; 503 when db down', async () => {
  const ok = await make()
  const j = (await ok.app.inject('/api/solar/health')).json()
  assert.equal(j.ok, true)
  assert.equal(j.daily.limit, 300)
  const bad = await make({ dbPing: async () => { throw new Error('down') } })
  assert.equal((await bad.app.inject('/api/solar/health')).statusCode, 503)
})

test('clientIp ignores junk headers', () => {
  const req = (h, ra = '::ffff:10.10.13.13') => ({ headers: h, socket: { remoteAddress: ra } })
  assert.equal(clientIp(req({ 'cf-connecting-ip': 'nope', 'x-forwarded-for': '198.51.100.7, 10.0.0.1' })), '198.51.100.7')
  assert.equal(clientIp(req({})), '10.10.13.13')
})
