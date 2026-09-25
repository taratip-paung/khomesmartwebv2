/**
 * Postgres tests — opt-in (need a real DB): SOLAR_DB_TEST=1 PGHOST=... PGDATABASE=... PGUSER=... npm test
 * WARNING: drops and recreates the tables in that database. Never point it at production.
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readConfig } from '../src/config.mjs'
import { createPool, migrate, createDbDailyLimiter } from '../src/db.mjs'

const on = process.env.SOLAR_DB_TEST === '1'
let pool
const quiet = { info() {} }

before(async () => {
  if (!on) return
  pool = createPool(readConfig().pg)
  await pool.query('DROP TABLE IF EXISTS api_daily_usage, schema_migrations')
})
after(async () => pool?.end())

test('migrate is idempotent', { skip: !on }, async () => {
  assert.deepEqual(await migrate(pool, quiet), ['001_api_daily_usage.sql'])
  assert.deepEqual(await migrate(pool, quiet), [])
})

test('daily cap holds under 50 concurrent requests and rolls over at Bangkok midnight', { skip: !on }, async () => {
  let t = Date.UTC(2026, 8, 25, 16, 59, 0) // 23:59 Bangkok
  const lim = createDbDailyLimiter(pool, { limit: 10, api: 'test', now: () => t })
  const results = await Promise.all(Array.from({ length: 50 }, () => lim.take()))
  assert.equal(results.filter((r) => r.ok).length, 10)
  assert.equal((await lim.status()).used, 10)
  t += 2 * 60_000 // 00:01 next Bangkok day
  assert.equal((await lim.take()).ok, true)
  assert.equal((await lim.status()).used, 1)
})

test('counter survives a new limiter instance (= server restart)', { skip: !on }, async () => {
  const t = Date.UTC(2026, 8, 26, 3, 0, 0)
  const a = createDbDailyLimiter(pool, { limit: 3, api: 'restart', now: () => t })
  await a.take()
  await a.take()
  const b = createDbDailyLimiter(pool, { limit: 3, api: 'restart', now: () => t })
  assert.equal((await b.take()).ok, true)
  assert.equal((await b.take()).ok, false)
})
