import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildApp } from '../src/app.mjs'
import { readConfig } from '../src/config.mjs'

const fx = (f) => JSON.parse(fs.readFileSync(new URL(`../../src/lib/solar/__tests__/fixtures/${f}`, import.meta.url)))
const NASA = fx('nasa-power-clim.json')
const PVGIS = fx('pvgis-era5-dr.json')
const ok = (body) => ({ ok: true, status: 200, json: async () => body })

function memStore() {
  const m = new Map()
  return { m, get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) }
}
async function make({ fetchImpl, store = memStore(), alerts = [] } = {}) {
  const calls = []
  const f =
    fetchImpl ??
    (async (url) => {
      calls.push(url)
      return ok(url.includes('nasa.gov') ? NASA : PVGIS)
    })
  const app = await buildApp({
    config: readConfig({ SOLAR_SERVER_KEY: 'k' }),
    limiter: { take: async () => ({ ok: true }), status: async () => ({}) },
    dbPing: async () => {},
    climateStore: store,
    fetchImpl: f,
    notify: { alert: async (k) => (alerts.push(k), true) },
    logger: false,
  })
  return { app, calls, store, alerts }
}

test('climate: first request fetches NASA + PVGIS once, then serves the 0.25° cell from cache', async () => {
  const { app, calls, store } = await make()
  const a = (await app.inject('/api/solar/climate?lat=18.7883&lng=98.9853')).json()
  assert.equal(a.ok, true)
  assert.equal(a.cached, false)
  assert.equal(a.climate.cell, '18.75,99.00')
  assert.equal(a.climate.tl.length, 12)
  assert.equal(calls.length, 2)
  assert.ok(calls.some((u) => u.includes('lat=18.75&lon=99')))
  // another house in the same cell → cache, no upstream call
  const b = await app.inject('/api/solar/climate?lat=18.80&lng=98.95')
  assert.equal(b.json().cached, true)
  assert.equal(calls.length, 2)
  assert.match(b.headers['cache-control'], /max-age=86400/)
  assert.equal(store.m.size, 1)
})

test('climate: concurrent requests for one cell share a single upstream fetch', async () => {
  const { app, calls } = await make()
  await Promise.all([1, 2, 3].map(() => app.inject('/api/solar/climate?lat=18.79&lng=98.98')))
  assert.equal(calls.length, 2)
})

test('climate: outside Thailand → 400; upstream down → 502 + alert, nothing cached', async () => {
  const { app } = await make()
  assert.equal((await app.inject('/api/solar/climate?lat=35&lng=139')).statusCode, 400)
  const down = await make({ fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }) })
  const r = await down.app.inject('/api/solar/climate?lat=18.79&lng=98.98')
  assert.equal(r.statusCode, 502)
  assert.equal(r.headers['cache-control'], 'no-store')
  assert.deepEqual(down.alerts, ['climate_upstream'])
  assert.equal(down.store.m.size, 0)
})
