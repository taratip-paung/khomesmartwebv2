import { test } from 'node:test'
import assert from 'node:assert/strict'
import { offsetLatLng, houseSize, houseFootprint, solarFromClock, clockFromSolar, equationOfTime, dayOfYear, hhmm } from '../geo.js'
import { sunPosition } from '../production.js'

const CM = { lat: 18.7883, lng: 98.9853 }
const dist = (a, b) => {
  const dn = (b.lat - a.lat) * 111_320
  const de = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot(dn, de)
}
const bearing = (a, b) => {
  const dn = b.lat - a.lat
  const de = (b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180)
  return ((Math.atan2(de, dn) * 180) / Math.PI + 360) % 360
}

test('geo: offset 100 m north/east', () => {
  assert.ok(Math.abs(dist(CM, offsetLatLng(CM, 0, 100)) - 100) < 0.5)
  assert.ok(Math.abs(dist(CM, offsetLatLng(CM, 100, 0)) - 100) < 0.5)
})

test('geo: house size from a roof face (gable face ≈ half the roof, on the slope)', () => {
  const flat = houseSize({ roof: 'flat', areaM2: 100 })
  assert.equal(flat.plan, 100)
  const gable = houseSize({ roof: 'gable', pitch: 30, areaM2: 60 })
  assert.equal(gable.plan, Math.round(2 * 60 * Math.cos(Math.PI / 6)))
  assert.equal(houseSize({}).plan, 90) // no data → typical house
  assert.equal(houseSize({ roof: 'flat', areaM2: 5000 }).plan, 400) // clamped (warehouse face)
})

test('geo: footprint is w × d, rotated so the arrow points along the azimuth', () => {
  for (const az of [0, 90, 135, 180, 270]) {
    const fp = houseFootprint({
      center: CM,
      azimuth: az,
      roof: 'gable',
      w: 12,
      d: 8,
    })
    const [a, b, , d4] = fp.outline
    assert.ok(Math.abs(dist(a, b) - 12) < 0.05, `w at ${az}`)
    assert.ok(Math.abs(dist(a, d4) - 8) < 0.05, `d at ${az}`)
    const br = bearing(fp.arrowFrom, fp.arrowTo)
    assert.ok(Math.abs(((br - az + 540) % 360) - 180) < 0.5, `arrow bearing ${br} vs ${az}`)
  }
  assert.equal(houseFootprint({ center: CM, azimuth: 180, roof: 'hip', w: 12, d: 8 }).ridges.length, 5)
  assert.equal(houseFootprint({ center: CM, azimuth: 180, roof: 'flat', w: 12, d: 8 }).ridges.length, 0)
})

test('solar time: Chiang Mai solar noon ≈ 12:24 clock time (±16 min over the year)', () => {
  for (const day of [15, 80, 172, 300, 355]) {
    const noonClock = clockFromSolar(12, CM.lng, day)
    assert.ok(noonClock > 12.1 && noonClock < 12.7, `day ${day}: ${hhmm(noonClock)}`)
    assert.ok(Math.abs(solarFromClock(noonClock, CM.lng, day) - 12) < 1e-9)
  }
  assert.ok(Math.abs(equationOfTime(307)) > 15) // early November ≈ +16 min
  // at solar noon the sun is due south in December, north of zenith in June (lat 18.8° < 23.4°)
  assert.ok(Math.abs(sunPosition(CM.lat, 355, 12.001).azimuth - 180) < 2)
  assert.ok(sunPosition(CM.lat, 172, 12.001).azimuth > 350 || sunPosition(CM.lat, 172, 12.001).azimuth < 10)
})

test('dates + formatting', () => {
  assert.equal(dayOfYear(new Date(2026, 0, 1)), 1)
  assert.equal(dayOfYear(new Date(2026, 11, 31)), 365)
  assert.equal(hhmm(12.4), '12:24')
  assert.equal(hhmm(6.999), '07:00')
})

test('geo: Google panel footprint — landscape long edge across the slope, projected by pitch', async () => {
  const { panelPolygon } = await import('../geo.js')
  const land = panelPolygon({ center: CM, azimuth: 180, pitch: 0, portrait: false })
  assert.ok(Math.abs(dist(land[0], land[1]) - 1.879) < 0.01) // across
  assert.ok(Math.abs(dist(land[1], land[2]) - 1.045) < 0.01) // along
  const port = panelPolygon({ center: CM, azimuth: 180, pitch: 60, portrait: true })
  assert.ok(Math.abs(dist(port[0], port[1]) - 1.045) < 0.01)
  assert.ok(Math.abs(dist(port[1], port[2]) - 1.879 * 0.5) < 0.01) // cos 60°
})

test('geo: convex hull outlines a group of panels', async () => {
  const { convexHull, panelPolygon, offsetLatLng } = await import('../geo.js')
  const pts = []
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) pts.push(...panelPolygon({ center: offsetLatLng(CM, i * 2, j * 1.1), azimuth: 180 }))
  const hull = convexHull(pts)
  assert.equal(hull.length, 4) // a 3 × 2 block of panels → one rectangle
  assert.ok(Math.abs(dist(hull[0], hull[2]) - Math.hypot(4 + 1.879, 1.1 + 1.045)) < 0.05)
})
