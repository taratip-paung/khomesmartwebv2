/**
 * Build step: dist/solar/index.html = dist/index.html with the /solar title, description and share image
 * (S1.5). Link previews (LINE, Facebook, X) don't run JavaScript, so the meta tags must be in the HTML
 * nginx sends for /solar — the SPA itself is identical (same /assets). nginx: `location = /solar`.
 * Change the image → give it a NEW file name (LINE/Facebook cache previews by image URL).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const SITE = 'https://beconnectedcm.com'
export const SOLAR_META = {
  title: 'Solar Builder — หลังคาบ้านคุณผลิตไฟได้แค่ไหน? | Be Connected',
  description:
    'ปักหมุดบ้าน ดูทิศแดดจริงจากดาวเทียม แล้วเรียนรู้ระบบโซลาร์ทีละขั้นกับน้องบี — ฟรี ไม่ต้องสมัคร · Learn solar using your own roof: satellite sun data, 3D sun path, step by step.',
  ogTitle: 'Solar Builder — หลังคาบ้านคุณผลิตไฟได้แค่ไหน?',
  ogDescription: 'ปักหมุดบ้าน ดูทิศแดดจริงจากดาวเทียม แล้วเรียนรู้ระบบโซลาร์ทีละขั้นกับน้องบี — ฟรี ไม่ต้องสมัคร',
  image: `${SITE}/og-solar-v1.png`,
  url: `${SITE}/solar`,
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export function solarHtml(html, m = SOLAR_META) {
  const set = (re, tag) => {
    if (!re.test(html)) throw new Error(`solarOgPage: ${re} not found in index.html`)
    html = html.replace(re, tag)
  }
  set(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`)
  set(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(m.description)}" />`)
  set(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(m.ogTitle)}" />`)
  set(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(m.ogDescription)}" />`)
  set(/<meta property="og:image" [^>]*>/, `<meta property="og:image" content="${m.image}" />`)
  set(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${m.url}" />`)
  set(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${m.url}" />`)
  return html
}

export default function solarOgPage() {
  return {
    name: 'solar-og-page',
    apply: 'build',
    async writeBundle(options) {
      const dir = options.dir || 'dist'
      const html = await readFile(join(dir, 'index.html'), 'utf8')
      await mkdir(join(dir, 'solar'), { recursive: true })
      await writeFile(join(dir, 'solar', 'index.html'), solarHtml(html))
    },
  }
}
