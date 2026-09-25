import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layoutCurve, kwhFor, marginal, defaultPanels, layoutSteps, googleCountFor, oursFromGoogle, DC_TO_AC } from '../layout.js'
import { DEFAULTS } from '../assumptions.js'

// shape of a real Google response (400 W panels): 4 → 40 panels, later ones on worse (north/shaded) spots
const CFG = [[4, 2800], [8, 5520], [12, 8150], [16, 10700], [20, 12900], [24, 14700], [30, 16800], [40, 19200]]
const G_AREA = 1.879 * 1.045

test('layout: company panel is JA Solar 625 W, 2.382 × 1.134 m', () => {
  assert.equal(DEFAULTS.panel.wp, 625)
  assert.deepEqual(DEFAULTS.panel.sizeM, [2.382, 1.134])
})

test('layout: Google layouts converted to our panels by roof area', () => {
  const A = 2.382 * 1.134
  assert.equal(oursFromGoogle(40), Math.floor((40 * G_AREA) / A)) // 29
  const c = layoutCurve(CFG)
  assert.deepEqual(c[0], { m: 0, n: 0, kwp: 0, kwh: 0, areaM2: 0 })
  const last = c[c.length - 1]
  assert.equal(last.n, 40)
  assert.equal(last.m, 29)
  assert.equal(last.kwp, (29 * 625) / 1000)
  assert.ok(Math.abs(last.areaM2 - 29 * A) < 1e-9)
  // energy scales with the watts actually on that roof area
  assert.ok(Math.abs(last.kwh - 19200 * DC_TO_AC * ((29 * 625) / (40 * 400))) < 1e-6)
  assert.deepEqual(layoutSteps(c), c.slice(1).map((p) => p.m))
})

test('layout: each extra panel adds less — energy grows less than linearly', () => {
  const c = layoutCurve(CFG)
  const first = c[1]
  assert.ok(marginal(c, 2) > marginal(c, 18))
  assert.ok(marginal(c, 18) > marginal(c, 28))
  assert.ok(kwhFor(c, 29) < (first.kwh / first.m) * 29 * 0.75)
})

test('layout: default ≈ 5 kWp, Google outline count, empty input', () => {
  const c = layoutCurve(CFG)
  const d = defaultPanels(c, 5)
  assert.ok(c.find((p) => p.m === d).kwp >= 5)
  assert.ok(c.filter((p) => p.m > 0 && p.m < d).every((p) => p.kwp < 5))
  assert.equal(googleCountFor(c, 29), 40)
  assert.equal(defaultPanels([], 5), null)
  assert.deepEqual(layoutCurve([]), [])
})
