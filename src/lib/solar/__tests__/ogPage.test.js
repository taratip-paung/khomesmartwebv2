import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { solarHtml, SOLAR_META } from '../../../../solar-server/solarOgPage.mjs'

// S1.5: /solar share preview — every tag must be found in the real index.html (build throws otherwise)
test('og page: /solar tags replace the home page ones, image file exists', () => {
  const html = solarHtml(readFileSync(new URL('../../../../index.html', import.meta.url), 'utf8'))
  assert.match(html, /<title>Solar Builder/)
  assert.match(html, /og:image" content="https:\/\/beconnectedcm\.com\/og-solar-v1\.png"/)
  assert.match(html, /og:url" content="https:\/\/beconnectedcm\.com\/solar"/)
  assert.match(html, /rel="canonical" href="https:\/\/beconnectedcm\.com\/solar"/)
  assert.doesNotMatch(html, /og-bee\.png/)
  const file = SOLAR_META.image.split('/').pop()
  assert.ok(existsSync(new URL(`../../../../public/${file}`, import.meta.url)), `public/${file} missing`)
})
