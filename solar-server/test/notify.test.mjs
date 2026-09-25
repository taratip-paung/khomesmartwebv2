import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNotifier } from '../src/notify.mjs'
import { buildApp } from '../src/app.mjs'
import { readConfig } from '../src/config.mjs'
import { createDailyLimiter } from '../../src/lib/solar/dailyLimit.js'

const fake = () => {
  const sent = []
  const fetchImpl = async (url, init) => (sent.push({ url, body: JSON.parse(init.body) }), { ok: true, status: 200 })
  return { sent, fetchImpl }
}

test('notifier: disabled without token/chat → sends nothing', async () => {
  const f = fake()
  const n = createNotifier({ fetchImpl: f.fetchImpl })
  assert.equal(n.enabled, false)
  assert.equal(await n.alert('x', 'hi'), false)
  assert.equal(f.sent.length, 0)
})

test('notifier: throttles per key, reports suppressed count, escapes HTML', async () => {
  let t = 0
  const f = fake()
  const n = createNotifier({ token: 'T', chatId: '-100', fetchImpl: f.fetchImpl, now: () => t, host: 'ct' })
  assert.equal(await n.alert('a', 'boom <x>'), true)
  assert.equal(await n.alert('a', 'boom'), false)
  assert.equal(await n.alert('a', 'boom'), false)
  assert.equal(await n.alert('b', 'other'), true) // separate bucket
  t += 15 * 60_000
  assert.equal(await n.alert('a', 'boom'), true)
  assert.equal(f.sent.length, 3)
  assert.match(f.sent[0].url, /botT\/sendMessage$/)
  assert.equal(f.sent[0].body.chat_id, '-100')
  assert.match(f.sent[0].body.text, /boom &lt;x&gt;/)
  assert.match(f.sent[2].body.text, /\+2 ครั้ง/)
})

test('notifier: Telegram failure never throws', async () => {
  const n = createNotifier({ token: 'T', chatId: '1', fetchImpl: async () => { throw new Error('blocked') }, log: { warn() {} } })
  assert.equal(await n.alert('a', 'x'), false)
})

test('app: alerts on Google error, 80 % and daily cap — without user coordinates', async () => {
  const alerts = []
  const notify = { alert: async (key, text) => (alerts.push({ key, text }), true) }
  const config = readConfig({ SOLAR_SERVER_KEY: 'k', SOLAR_DAILY_LIMIT: '5', SOLAR_IP_HOURLY: '100' })
  const l = createDailyLimiter({ limit: 5 })
  let status = 403
  const app = await buildApp({
    config,
    notify,
    logger: false,
    dbPing: async () => {},
    limiter: { take: async () => l.take(), status: async () => l.status() },
    fetchImpl: async () => ({ status, ok: false, json: async () => ({ error: { message: 'key not valid' } }) }),
  })
  for (let i = 0; i < 6; i++) await app.inject('/api/solar/insights?lat=18.78831&lng=98.98531')
  const keys = alerts.map((a) => a.key.split(':')[0])
  assert.ok(keys.includes('google_api_error'))
  assert.equal(keys.filter((k) => k === 'daily_80').length, 1) // 4/5
  assert.equal(keys.filter((k) => k === 'daily_limit').length, 1)
  assert.ok(alerts.every((a) => !a.text.includes('18.78') && !a.text.includes('98.98')))
})

test('app: db down on health → alert', async () => {
  const alerts = []
  const app = await buildApp({
    config: readConfig({}),
    notify: { alert: async (key) => (alerts.push(key), true) },
    logger: false,
    dbPing: async () => { throw new Error('ECONNREFUSED') },
    limiter: { take: async () => ({}), status: async () => ({}) },
  })
  assert.equal((await app.inject('/api/solar/health')).statusCode, 503)
  assert.deepEqual(alerts, ['db_down'])
})
