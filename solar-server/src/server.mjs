/**
 * Entry point (systemd: solar-server.service on CT 1330).
 * Runs pending migrations, then listens. Exits non-zero on startup failure so systemd restarts it.
 */
import { loadDotEnv, readConfig } from './config.mjs'
import { buildApp } from './app.mjs'
import { createPool, migrate, createDbDailyLimiter } from './db.mjs'
import { createNotifier } from './notify.mjs'

loadDotEnv()
const config = readConfig()
const pool = createPool(config.pg)
const notify = createNotifier({ token: config.telegram.token, chatId: config.telegram.chatId })

const app = await buildApp({
  config,
  limiter: createDbDailyLimiter(pool, { limit: config.dailyLimit }),
  dbPing: () => pool.query('SELECT 1'),
  notify,
})

try {
  if (!config.key) app.log.warn('SOLAR_SERVER_KEY is empty — /insights will answer 503')
  if (!notify.enabled) app.log.warn('TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set — alerts disabled')
  await migrate(pool, app.log)
  await app.listen({ port: config.port, host: config.host })
} catch (e) {
  app.log.error(e)
  await notify.alert('startup', `เริ่มระบบไม่สำเร็จ (systemd จะลองใหม่): ${e.message}`, { throttleMs: 3_600_000 })
  process.exit(1)
}

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.once(sig, async () => {
    await app.close()
    await pool.end()
    process.exit(0)
  })
}
