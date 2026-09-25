// `npm run migrate` — apply pending migrations without starting the server (the server also runs them on start)
import { loadDotEnv, readConfig } from './config.mjs'
import { createPool, migrate } from './db.mjs'

loadDotEnv()
const pool = createPool(readConfig().pg)
try {
  const applied = await migrate(pool)
  console.log(applied.length ? `applied: ${applied.join(', ')}` : 'up to date')
} finally {
  await pool.end()
}
