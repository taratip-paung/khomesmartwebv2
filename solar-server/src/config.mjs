/**
 * Config from environment. On CT 1330 systemd loads /opt/beconnected-solar/solar.env (chmod 600, owner solar).
 * For a local run, a `.env` next to package.json is read too (never committed — see .gitignore).
 *
 *   SOLAR_SERVER_KEY    Google key, Solar API only, IP-restricted to the home public IP   (required)
 *   PORT / HOST         default 8790 / 0.0.0.0 (HAProxy 10.10.13.13 connects to 10.10.13.30:8790)
 *   TRUSTED_PROXIES     peers allowed to call the API, default "10.10.13.13,127.0.0.1"
 *   SOLAR_DAILY_LIMIT   Google calls per Bangkok day, all users combined, default 300
 *   SOLAR_IP_HOURLY     /insights calls per client IP per hour, default 20
 *   TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID  alerts (S2.5) — same bot + group as the contact form; optional
 *   PGHOST/PGDATABASE/PGUSER  default unix socket /var/run/postgresql, db+user "solar" (peer auth, no password)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export function loadDotEnv(file = path.join(here, '..', '.env')) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const int = (v, d) => (Number.isFinite(Number(v)) && String(v).trim() !== '' ? Number(v) : d)
const list = (v, d) => (v ?? d).split(',').map((s) => s.trim()).filter(Boolean)

export function readConfig(env = process.env) {
  return {
    key: env.SOLAR_SERVER_KEY ?? '',
    port: int(env.PORT, 8790),
    host: env.HOST || '0.0.0.0',
    trustedProxies: list(env.TRUSTED_PROXIES, '10.10.13.13,127.0.0.1'),
    dailyLimit: int(env.SOLAR_DAILY_LIMIT, 300),
    ipHourly: int(env.SOLAR_IP_HOURLY, 20),
    telegram: { token: env.TELEGRAM_BOT_TOKEN ?? '', chatId: env.TELEGRAM_CHAT_ID ?? '' },
    pg: {
      host: env.PGHOST || '/var/run/postgresql',
      database: env.PGDATABASE || 'solar',
      user: env.PGUSER || 'solar',
      max: 5,
    },
  }
}
