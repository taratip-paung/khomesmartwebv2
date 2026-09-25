// `npm run alert:test` on the CT — sends one test alert to confirm the Telegram settings in solar.env
import { readConfig } from './config.mjs'
import { createNotifier } from './notify.mjs'

const { telegram } = readConfig()
const n = createNotifier({ token: telegram.token, chatId: telegram.chatId })
if (!n.enabled) {
  console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set')
  process.exit(1)
}
const ok = await n.alert('test', 'ทดสอบการแจ้งเตือน — ถ้าเห็นข้อความนี้ แปลว่าระบบแจ้งเตือนของ backend ใช้งานได้ (ไม่ต้องทำอะไร)')
console.log(ok ? 'sent' : 'FAILED (see warning above)')
process.exit(ok ? 0 : 1)
