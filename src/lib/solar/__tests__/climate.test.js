import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildClimate, parseNasa, parsePvgis, clearDayGhi, climateCell, climateUrls, MID_DAY } from '../climate.js'
import { CLIMATE_CM } from '../../../data/solar/climateCM.js'

const nasa = JSON.parse(fs.readFileSync(new URL('./fixtures/nasa-power-clim.json', import.meta.url)))
const pvgis = JSON.parse(fs.readFileSync(new URL('./fixtures/pvgis-era5-dr.json', import.meta.url)))

test('climate: parse NASA POWER + PVGIS, local-time temperatures', () => {
  const n = parseNasa(nasa)
  assert.equal(n.ghi.length, 12)
  assert.equal(n.ghi[3], 6.0158)
  const p = parsePvgis(pvgis)
  assert.equal(p.alt, 315)
  assert.equal(p.tHourly[0][7], 16.61) // 00:30 UTC = 07:xx Bangkok
  assert.throws(() => parseNasa({}), /nasa/)
  assert.throws(() => parsePvgis({ message: 'out of coverage' }), /pvgis/)
})

test('climate: calibrated clear sky reproduces NASA clear-sky totals (±1 %)', () => {
  const c = buildClimate({ lat: 18.788, lng: 98.985, nasa, pvgis })
  c.clr.forEach((target, m) => {
    const got = clearDayGhi(c.lat, MID_DAY[m], c.tl[m], c.alt)
    assert.ok(Math.abs(got / target - 1) < 0.01, `month ${m + 1}`)
  })
})

test('climate: built-in Chiang Mai table = generated from the fixtures (no hand edits)', () => {
  const c = buildClimate({ lat: 18.788, lng: 98.985, nasa, pvgis })
  c.tl.forEach((v, m) => assert.ok(Math.abs(v - CLIMATE_CM.tl[m]) < 0.01))
  c.ghi.forEach((v, m) => assert.ok(Math.abs(v - CLIMATE_CM.ghi[m]) < 0.006))
})

test('climate: 0.25° cache cell + upstream URLs', () => {
  assert.deepEqual(climateCell(18.7883, 98.9853), { key: '18.75,99.00', lat: 18.75, lng: 99 })
  assert.deepEqual(climateCell(13.7563, 100.5018).key, '13.75,100.50')
  const u = climateUrls(18.75, 99)
  assert.match(u.nasa, /power\.larc\.nasa\.gov.*CLRSKY_SFC_SW_DWN/)
  assert.match(u.pvgis, /DRcalc.*showtemperatures=1/)
})
