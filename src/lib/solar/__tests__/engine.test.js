// Run: npm run test:solar   (node:test — no extra dependencies)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recommendFromBill, fromKwp } from '../sizing.js'
import { sunPosition, transpositionFactor, annualYield, annualYieldFromSunshine, compass8 } from '../production.js'
import { vocAt, seriesLimits, checkMpptInput, suggestStrings } from '../stringDesign.js'
import { voltageDropPct, selectBreaker, acCircuit, dcCircuit, spd } from '../protection.js'
import { usableKwh, modulesFor, checkStack } from '../battery.js'
import { validateSystem } from '../rules.js'
import { byId } from '../../../data/solar/catalog.js'

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} expected ${b}±${tol}, got ${a}`)
const keys = (r) => r.issues.map((x) => x.key)
const panel = byId['pv-620-topcon']

test('sizing: 4,000 THB bill → ~4.5 kWp → 5 kW inverter', () => {
  const r = recommendFromBill({ billThb: 4000, dayShare: 0.6 })
  near(r.kwhMonth, 909.1, 0.5)
  near(r.kwpNeeded, 4.5, 0.15)
  assert.equal(r.inverterKw, 5)
  assert.equal(r.panels, 8)
  assert.equal(r.batteryKwhSuggested, 15) // night 12.1 kWh → round up to 5 kWh steps
})

test('sizing: fromKwp never picks an inverter far below the need', () => {
  assert.equal(fromKwp(9.8).inverterKw, 10)
  assert.equal(fromKwp(30).inverterKw, 20) // capped at the largest standard size
})

test('sun: solar noon on the June solstice at Chiang Mai is almost overhead, north side', () => {
  const s = sunPosition(18.79, 172, 12)
  near(s.elevation, 85.6, 0.5)
  const w = sunPosition(18.79, 355, 12) // December solstice → low in the south
  near(w.elevation, 47.8, 0.6)
  near(w.azimuth, 180, 1)
})

test('orientation: flat = 1, south tilt gains a little, north tilt loses', () => {
  near(transpositionFactor({ tilt: 0, azimuth: 180 }), 1, 1e-9)
  const south = transpositionFactor({ tilt: 15, azimuth: 180 })
  const east = transpositionFactor({ tilt: 15, azimuth: 90 })
  const north = transpositionFactor({ tilt: 15, azimuth: 0 })
  assert.ok(south > 1 && south < 1.08, `south ${south}`)
  assert.ok(east < 1 && east > 0.93, `east ${east}`)
  assert.ok(north < east, `north ${north} < east ${east}`)
  assert.ok(north > 0.85, `north ${north}`)
})

test('yield: ~1,450–1,550 kWh/kWp/yr flat; Solar API path uses sunshine hours directly', () => {
  const y = annualYield({ kwp: 1, tilt: 0 })
  assert.ok(y.kwhPerKwp > 1400 && y.kwhPerKwp < 1550, `${y.kwhPerKwp}`)
  assert.equal(annualYieldFromSunshine({ kwp: 5, sunshineHoursPerYear: 1800 }).kwh, 5 * 1800 * 0.8)
  assert.equal(compass8(175), 'S')
  assert.equal(compass8(350), 'N')
})

test('string: Voc rises in the cold; Huawei 5K (600 V) allows max 10 × 620 W at 5 °C', () => {
  near(vocAt(panel, 5), 55.6 * 1.05, 1e-9)
  const lim = seriesLimits(panel, byId['hw-5ktl-l1'])
  assert.equal(lim.maxSeries, 10) // 600 / 58.38
  const ok = checkMpptInput({ panel, inverter: byId['hw-5ktl-l1'], series: 8 })
  // voltages fine; but a 620 W panel's Imp (13.39 A) is above this MPPT's 12.5 A → clipping warning (real lesson)
  assert.deepEqual(keys(ok), ['imp_over_mppt'])
  assert.equal(ok.issues[0].level, 'warning')
  const bad = checkMpptInput({ panel, inverter: byId['hw-5ktl-l1'], series: 11 })
  assert.ok(keys(bad).includes('voc_over_max'))
  assert.equal(bad.issues.find((x) => x.key === 'voc_over_max').level, 'error')
})

test('string: Deye 5K (500 V, MPPT 150–425) — 9 × 620 W in one string exceeds 500 V when cold', () => {
  const inv = byId['dy-5k-sg04lp1']
  assert.ok(!keys(checkMpptInput({ panel, inverter: inv, series: 8 })).includes('voc_over_max')) // 467 V
  const r = checkMpptInput({ panel, inverter: inv, series: 9 }) // 525 V
  assert.ok(keys(r).includes('voc_over_max'))
  assert.deepEqual(suggestStrings({ panel, inverter: inv, panels: 8 }), [{ mpptIndex: 0, series: 8, parallel: 1 }])
  assert.deepEqual(suggestStrings({ panel, inverter: byId['hw-5ktl-l1'], panels: 11 }), [{ mpptIndex: 0, series: 6, parallel: 1 }, { mpptIndex: 1, series: 5, parallel: 1 }])
  assert.deepEqual(suggestStrings({ panel, inverter: inv, panels: 12 }), [{ mpptIndex: 0, series: 6, parallel: 1 }, { mpptIndex: 1, series: 6, parallel: 1 }])
})

test('string: two strings in parallel on a 17 A MPPT → Isc error', () => {
  const r = checkMpptInput({ panel, inverter: byId['dy-5k-sg04lp1'], series: 4, parallel: 2 })
  assert.ok(keys(r).includes('isc_over_max'))
})

test('protection: voltage drop, breaker, SPD', () => {
  // 20 A, 30 m, 4 mm², 230 V single phase: 2·20·(0.0225·30/4)/230 = 2.93 %
  near(voltageDropPct({ currentA: 20, lengthM: 30, mm2: 4, voltage: 230, kind: '1ph' }), 2.935, 0.01)
  assert.equal(selectBreaker(23).rating, 32) // 28.75 A → 32 A
  const ac = acCircuit({ inverter: byId['hw-5ktl-l1'], lengthM: 10 })
  assert.equal(ac.breaker.rating, 32)
  assert.ok(ac.cable.ampacity >= 32, 'cable protected by breaker')
  assert.ok(!keys(ac).includes('breaker_exceeds_cable'))
  const d = dcCircuit({ iscTotal: 14.06 * 3, vmpString: 300, parallel: 3 })
  assert.ok(keys(d).includes('string_fuse_required'))
  assert.equal(spd({ vocColdMax: 467, phase: 1 }).dc.ucV, 600)
  assert.equal(spd({ vocColdMax: 520, phase: 1 }).dc.ucV, 1000)
})

test('battery: usable energy and stack limits', () => {
  const luna = byId['hw-luna2000-s0']
  assert.equal(usableKwh(luna, 2), 10)
  assert.equal(modulesFor(luna, 22), 3) // clamped to max stack
  assert.ok(checkStack(luna, 4).some((x) => x.key === 'battery_too_many'))
})

test('rules: Huawei + battery + backup → SmartGuard auto-added and locked', () => {
  const r = validateSystem({ phase: 1, backupMode: 'part', panelId: 'pv-620-topcon', panels: 8, inverterId: 'hw-5ktl-l1', batteryId: 'hw-luna2000-s0', batteryModules: 2 }, { byId })
  const sg = r.autoAdds.find((x) => x.kind === 'backup')
  assert.equal(sg.id, 'hw-smartguard-s0')
  assert.equal(sg.locked, true)
  assert.ok(r.autoAdds.some((x) => x.kind === 'safety' && x.locked))
  assert.ok(r.autoAdds.some((x) => x.kind === 'meter'))
  assert.equal(r.ok, true, JSON.stringify(r.issues))
})

test('rules: Huawei + battery but no backup → explain "battery ≠ outage power"', () => {
  const r = validateSystem({ phase: 1, backupMode: 'none', panelId: 'pv-620-topcon', panels: 8, inverterId: 'hw-5ktl-l1', batteryId: 'hw-luna2000-s0', batteryModules: 2 }, { byId })
  assert.ok(keys(r).includes('battery_no_backup'))
  assert.ok(!r.autoAdds.some((x) => x.kind === 'backup'))
})

test('rules: Deye backup is built in (nothing added), 3-phase inverter on 1-phase house is an error', () => {
  const r = validateSystem({ phase: 1, backupMode: 'part', panelId: 'pv-620-topcon', panels: 8, inverterId: 'dy-5k-sg04lp1', batteryId: 'dy-se-g51pro', batteryModules: 2 }, { byId })
  assert.ok(!r.autoAdds.some((x) => x.kind === 'backup'))
  assert.ok(keys(r).includes('backup_builtin'))
  assert.equal(r.ok, true, JSON.stringify(r.issues))
  const bad = validateSystem({ phase: 1, backupMode: 'none', panelId: 'pv-620-topcon', panels: 16, inverterId: 'hw-10ktl-m1' }, { byId })
  assert.ok(keys(bad).includes('phase_mismatch'))
  assert.equal(bad.ok, false)
})

test('rules: HV battery on an LV inverter is rejected', () => {
  const r = validateSystem({ phase: 1, backupMode: 'none', panelId: 'pv-620-topcon', panels: 8, inverterId: 'dy-5k-sg04lp1', batteryId: 'hw-luna2000-s0', batteryModules: 1 }, { byId })
  assert.ok(keys(r).includes('battery_incompatible'))
  assert.equal(r.ok, false)
})

test('explain: every key the engine can emit has TH + EN text (basic + tech)', async () => {
  const { EXPLAIN, explain } = await import('../../../data/solar/explain.js')
  const fs = await import('node:fs')
  const src = ['rules.js', 'stringDesign.js', 'protection.js', 'battery.js']
    .map((f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8')).join('\n')
  const emitted = new Set([...src.matchAll(/(?:key|reason): '([a-z_]+)'/g)].map((m) => m[1]))
  for (const k of emitted) {
    assert.ok(EXPLAIN[k], `missing explanation for ${k}`)
    for (const lvl of ['basic', 'tech']) for (const l of ['th', 'en']) assert.ok(EXPLAIN[k][lvl]?.[l], `${k}.${lvl}.${l}`)
  }
  assert.match(explain('voc_over_max', 'tech', 'en', { t: 5, voc: 525.4, max: 500, mppt: 1, maxSeries: 8 }), /525\.4 V > Vdc max 500 V/)
})
