/**
 * Postgres: pool, migrations, and the persisted daily counter.
 * Peer auth over the unix socket (OS user "solar" = DB role "solar") → no DB password anywhere.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { bangkokDay, nextBangkokMidnight } from '../../src/lib/solar/dailyLimit.js'

const MIGRATIONS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

export const createPool = (cfg) => new pg.Pool(cfg)

/** apply migrations/NNN_*.sql in order, once each, inside one transaction + advisory lock */
export async function migrate(pool, log = console) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(724301)')
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    )
    const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name))
    const files = fs.readdirSync(MIGRATIONS).filter((f) => /^\d+_.+\.sql$/.test(f)).sort()
    const applied = []
    for (const f of files) {
      if (done.has(f)) continue
      await client.query(fs.readFileSync(path.join(MIGRATIONS, f), 'utf8'))
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f])
      applied.push(f)
    }
    await client.query('COMMIT')
    if (applied.length) log.info?.(`migrations applied: ${applied.join(', ')}`)
    return applied
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    client.release()
  }
}

/**
 * Daily cap shared by all users, same contract as src/lib/solar/dailyLimit.js (dev) but in Postgres.
 * One atomic statement: increments only while used < limit, so concurrent requests can never overshoot.
 */
export function createDbDailyLimiter(pool, { limit = 300, api = 'solar_building_insights', now = () => Date.now() } = {}) {
  return {
    async take() {
      const t = now()
      const resetsAt = nextBangkokMidnight(t)
      if (limit <= 0) return { ok: false, used: 0, limit, resetsAt }
      const { rows } = await pool.query(
        `INSERT INTO api_daily_usage (day, api, used) VALUES ($1, $2, 1)
         ON CONFLICT (day, api) DO UPDATE SET used = api_daily_usage.used + 1
         WHERE api_daily_usage.used < $3
         RETURNING used`,
        [bangkokDay(t), api, limit],
      )
      if (!rows.length) return { ok: false, used: limit, limit, resetsAt }
      return { ok: true, used: rows[0].used, limit, resetsAt }
    },
    async status() {
      const day = bangkokDay(now())
      const { rows } = await pool.query('SELECT used FROM api_daily_usage WHERE day = $1 AND api = $2', [day, api])
      return { used: rows[0]?.used ?? 0, limit, day }
    },
  }
}

/** climate cache per grid cell (fresh for `maxAgeDays`) */
export function createClimateStore(pool, { maxAgeDays = 365 } = {}) {
  return {
    async get(cell) {
      const { rows } = await pool.query(
        `SELECT data FROM climate_cells WHERE cell = $1 AND fetched_at > now() - make_interval(days => $2)`,
        [cell, maxAgeDays],
      )
      return rows[0]?.data ?? null
    },
    async put(cell, data) {
      await pool.query(
        `INSERT INTO climate_cells (cell, data) VALUES ($1, $2)
         ON CONFLICT (cell) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()`,
        [cell, data],
      )
    },
    async count() {
      const { rows } = await pool.query('SELECT count(*)::int AS n FROM climate_cells')
      return rows[0].n
    },
  }
}
