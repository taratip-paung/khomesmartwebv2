import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { monthlyYield, seasonYield, dayCurve, curveAt, curveEnergy, sunFacts, seasonOfDay, pickInverterKw, effectivePR, acPower, SEASONS } from '../seasons.js'
import { clockFromSolar } from '../geo.js'
import { CLIMATE_CM } from '../../../data/solar/climateCM.js'
import { DEFAULTS } from '../assumptions.js'

const LAT = 18.79
const o = { tilt: 20, azimuth: 180, latitude: LAT }

test('seasons: whole months cover the year exactly once', () => {
  const all = Object.values(SEASONS).flatMap((s) => s.months).sort((a, b) => a - b)
  assert.deepEqual(all, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  assert.equal(seasonOfDay(105), 'hot')
  assert.equal(seasonOfDay(227), 'rainy')
  assert.equal(seasonOfDay(1), 'cool')
  assert.equal(seasonOfDay(350), 'cool')
})

test('average-day irradiance on a 20° south panel vs PVGIS-ERA5: within 8 % May–Jan; ERA5 higher in the Feb–Apr smoke season', () => {
  // independent check: PVGIS G(i) is its own tilted-plane irradiance from ERA5; our model starts from NASA POWER
  const pv = JSON.parse(fs.readFileSync(new URL('./fixtures/pvgis-era5-dr.json', import.meta.url)))
  const pvDaily = Array(12).fill(0)
  for (const r of pv.outputs.daily_profile) pvDaily[r.month - 1] += r['G(i)'] / 1000
  const mid = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]
  mid.forEach((day, m) => {
    // p.poa = irradiance before glass reflection → like-for-like with PVGIS G(i)
    const ours = dayCurve({ kind: 'avg', day, ...o }).reduce((s, p) => s + p.poa * 0.25, 0) / 1000
    const k = ours / pvDaily[m]
    // NASA (satellite-observed, MERRA-2 aerosols) sees the burning-season haze; ERA5's aerosol climatology largely doesn't
    const smoke = m >= 1 && m <= 3
    assert.ok(smoke ? k > 0.82 && k <= 1.0 : Math.abs(k - 1) < 0.08, `month ${m + 1}: ours ${ours.toFixed(2)} vs PVGIS ${pvDaily[m].toFixed(2)}`)
  })
})

test('year: 1,400–1,550 kWh per kWp for a 20° south roof in Chiang Mai; PR 0.78–0.86', () => {
  const year = monthlyYield(o).reduce((s, v) => s + v, 0)
  assert.ok(year > 1400 && year < 1550, `${year}`)
  const pr = effectivePR(o)
  assert.ok(pr > 0.78 && pr < 0.86, `PR ${pr}`)
})

test('season split: hot season gives most per day, rainy least (clouds); seasons sum to the year', () => {
  const { seasons, yearKwh } = seasonYield({ kwp: 5, ...o })
  assert.ok(seasons.hot.perDay > seasons.rainy.perDay)
  assert.ok(seasons.cool.perDay > seasons.rainy.perDay)
  const sum = seasons.hot.kwh + seasons.rainy.kwh + seasons.cool.kwh
  assert.ok(Math.abs(sum - yearKwh) < 1e-6)
  assert.ok(Math.abs(seasons.hot.share + seasons.rainy.share + seasons.cool.share - 1) < 1e-9)
  const b = seasonYield({ kwp: 1, ...o, annualKwhPerKwp: 1200 })
  assert.ok(Math.abs(b.yearKwh - 1200) < 1e-6)
})

test('clear day: 9 × JA 625 W (5.6 kWp) on a Huawei 5 kW peaks ~4.0–4.4 kW at noon; exactly 5 kWp ~3.6–4.0 kW', () => {
  const big = dayCurve({ kind: 'clear', day: 105, ...o, kwp: 5.625, invKw: 5 })
  const peak = big.reduce((a, p) => (p.kw > a.kw ? p : a))
  assert.ok(peak.kw > 4.0 && peak.kw < 4.4, `peak ${peak.kw}`)
  assert.ok(Math.abs(peak.h - 12) <= 0.25)
  const five = Math.max(...dayCurve({ kind: 'clear', day: 105, ...o, kwp: 5 }).map((p) => p.kw))
  assert.ok(five > 3.6 && five < 4.0, `5 kWp peak ${five}`)
  // the average day (clouds/rain) is below the clear day; far below in the rainy season
  const avgHot = curveEnergy(dayCurve({ kind: 'avg', day: 105, ...o, kwp: 5 }))
  const avgRain = curveEnergy(dayCurve({ kind: 'avg', day: 227, ...o, kwp: 5 }))
  const clrRain = curveEnergy(dayCurve({ kind: 'clear', day: 227, ...o, kwp: 5 }))
  assert.ok(avgRain < 0.7 * clrRain && avgHot > avgRain)
})

test('inverter clips; heat lowers output; east roofs peak in the morning', () => {
  assert.equal(acPower({ poaW: 1000, tAir: 25, kwp: 12, invKw: 5 }), 5)
  assert.ok(acPower({ poaW: 900, tAir: 38, kwp: 5 }) < acPower({ poaW: 900, tAir: 20, kwp: 5 }))
  assert.equal(pickInverterKw(5.625), 5)
  assert.equal(pickInverterKw(7.5), 6)
  assert.equal(pickInverterKw(14), 12)
  const e = dayCurve({ kind: 'clear', day: 105, tilt: 25, azimuth: 90, latitude: LAT, kwp: 5 })
  assert.ok(e.reduce((a, p) => (p.kw > a.kw ? p : a)).h < 11.5)
  assert.equal(curveAt(e, 5.1), 0)
  assert.equal(DEFAULTS.inverter.efficiency, 0.975)
})

test('climate table: haze (Linke turbidity) highest in the burning season, lowest in cool months', () => {
  const tl = CLIMATE_CM.tl
  assert.ok(tl[2] > 5.3 && tl[3] > 5.3) // Mar, Apr
  assert.ok(tl[11] < 4.1 && tl[0] < 4.1) // Dec, Jan
  assert.equal(CLIMATE_CM.tHourly.length, 12)
  assert.ok(CLIMATE_CM.tHourly[3][14] > CLIMATE_CM.tHourly[3][6]) // afternoon warmer than dawn (local clock)
})

test('sun facts: December sun rises south-east and stays in the south; June noon sun is to the north', () => {
  const dec = sunFacts(LAT, 355)
  assert.ok(dec.rise.az > 110 && dec.rise.az < 125, `rise ${dec.rise.az}`)
  assert.ok(Math.abs(dec.noon.azimuth - 180) < 2 && dec.noon.elevation < 50)
  assert.ok(dec.dayLength > 10.8 && dec.dayLength < 11.4)
  const jun = sunFacts(LAT, 172)
  assert.ok(jun.noon.azimuth > 350 || jun.noon.azimuth < 10)
  assert.ok(jun.dayLength > 12.8)
})

test('sunrise/sunset match published times for Chiang Mai within 2 min (sunrise-sunset.org, Sep 2026)', () => {
  const LNG = 98.98468
  const ref = [
    [244, '06:08', '18:40'],
    [258, '06:10', '18:28'],
    [268, '06:12', '18:19'],
    [273, '06:13', '18:14'],
  ]
  const toH = (s) => +s.slice(0, 2) + +s.slice(3) / 60
  for (const [day, rise, set] of ref) {
    const f = sunFacts(18.79038, day)
    assert.ok(Math.abs(clockFromSolar(f.rise.h, LNG, day) - toH(rise)) * 60 <= 2, `day ${day} rise`)
    assert.ok(Math.abs(clockFromSolar(f.set.h, LNG, day) - toH(set)) * 60 <= 2, `day ${day} set`)
  }
})
