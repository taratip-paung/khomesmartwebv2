/**
 * Small geo + solar-time helpers for Solar Builder (pure, no Google/three dependency — unit tested).
 *
 * Conventions: azimuth = degrees clockwise from north (0 N, 90 E, 180 S, 270 W).
 * A house "faces" `azimuth` = the direction its main panel side looks at.
 */
const R_EARTH_M_PER_DEG = 111_320 // metres per degree of latitude (and of longitude at the equator)
const rad = (d) => (d * Math.PI) / 180
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/** offset a lat/lng by (east, north) metres — plenty accurate for a single house */
export function offsetLatLng({ lat, lng }, eastM, northM) {
  return {
    lat: lat + northM / R_EARTH_M_PER_DEG,
    lng: lng + eastM / (R_EARTH_M_PER_DEG * Math.cos(rad(lat))),
  }
}

/**
 * House size on the ground from one Solar API roof face (or a default when there is no data).
 * Flat: the face ≈ the roof. Gable/hip: the chosen face is one slope ≈ half the roof, measured on the slope.
 * Returns w (along the ridge, across the facing) × d (front→back) in metres.
 */
export function houseSize({ roof = 'flat', pitch = 20, areaM2 } = {}) {
  let plan = 90 // typical Thai detached house footprint when we know nothing
  if (areaM2 > 0) plan = roof === 'flat' ? areaM2 : 2 * areaM2 * Math.cos(rad(clamp(pitch, 0, 60)))
  plan = clamp(plan, 40, 400)
  const w = Math.sqrt(plan * 1.35)
  return {
    w: +w.toFixed(2),
    d: +(plan / w).toFixed(2),
    plan: Math.round(plan),
  }
}

/**
 * Top-down outline of the house on the map, rotated to `azimuth`:
 * outline (4 corners), panel area (on the facing slope / on racks for a flat roof),
 * ridge lines (gable: one line, hip: ridge + 4 hips) and the facing arrow tip.
 */
export function houseFootprint({ center, azimuth, roof = 'flat', w, d }) {
  const f = [Math.sin(rad(azimuth)), Math.cos(rad(azimuth))] // facing (east, north)
  const r = [Math.cos(rad(azimuth)), -Math.sin(rad(azimuth))] // to the right of the facing
  const P = (u, v) => offsetLatLng(center, u * r[0] + v * f[0], u * r[1] + v * f[1])
  const rect = (u0, u1, v0, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]
  const hw = w / 2
  const hd = d / 2
  const outline = rect(-hw, hw, -hd, hd)
  let panels
  let ridges = []
  if (roof === 'flat') {
    panels = rect(-0.4 * w, 0.4 * w, -0.34 * d, 0.34 * d)
  } else if (roof === 'gable') {
    panels = rect(-0.38 * w, 0.38 * w, 0.08 * d, 0.44 * d)
    ridges = [[P(-hw, 0), P(hw, 0)]]
  } else {
    const k = Math.max(0, hw - hd) // hip: ridge shortened by half the depth at each end
    panels = rect(-0.3 * w, 0.3 * w, 0.08 * d, 0.4 * d)
    ridges = [
      [P(-k, 0), P(k, 0)],
      [P(-k, 0), P(-hw, -hd)],
      [P(-k, 0), P(-hw, hd)],
      [P(k, 0), P(hw, -hd)],
      [P(k, 0), P(hw, hd)],
    ]
  }
  return { outline, panels, ridges, arrowFrom: P(0, 0), arrowTo: P(0, hd + 4) }
}

/* ------------------------------------------------------------------ solar time */

/** day of year 1–366 (local date) */
export function dayOfYear(date = new Date()) {
  const start = Date.UTC(date.getFullYear(), 0, 1)
  const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((now - start) / 86_400_000) + 1
}

/** equation of time in minutes — NOAA / Spencer series (±0.5 min) */
export function equationOfTime(day) {
  const g = ((2 * Math.PI) / 365) * (day - 1)
  return 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
}

/**
 * Clock time (Thailand, UTC+7) → local solar time used by sunPosition().
 * Chiang Mai (98.98° E) is ~24 min "behind" the UTC+7 meridian (105° E): solar noon ≈ 12:24 clock time.
 */
export const solarFromClock = (clockHour, lng, day, tzHours = 7) => clockHour + (lng - 15 * tzHours) / 15 + equationOfTime(day) / 60
export const clockFromSolar = (solarHour, lng, day, tzHours = 7) => solarHour - (lng - 15 * tzHours) / 15 - equationOfTime(day) / 60

/** "HH:MM" for a fractional hour */
export const hhmm = (h) => {
  const t = Math.round((((h % 24) + 24) % 24) * 60)
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** named days for the sun-path picker */
export const SUN_DAYS = { jun: 172, mar: 80, dec: 355 }

/**
 * One Google-recommended panel as a map polygon. Google: LANDSCAPE = long edge perpendicular to the roof face's
 * azimuth, PORTRAIT = long edge along it. The along-slope edge is drawn projected (× cos pitch) as seen from above.
 */
export function panelPolygon({ center, azimuth, pitch = 0, portrait = false, size = [1.879, 1.045] }) {
  const [long, short] = size
  const across = portrait ? short : long
  const along = (portrait ? long : short) * Math.cos(rad(pitch))
  const f = [Math.sin(rad(azimuth)), Math.cos(rad(azimuth))]
  const r = [Math.cos(rad(azimuth)), -Math.sin(rad(azimuth))]
  const P = (u, v) => offsetLatLng(center, u * r[0] + v * f[0], u * r[1] + v * f[1])
  const u = across / 2
  const v = along / 2
  return [P(-u, -v), P(u, -v), P(u, v), P(-u, v)]
}

/** convex hull (Andrew's monotone chain) of lat/lng points — outlines a group of panels on the map */
const mm = (v) => Math.round(v * 1000) / 1000 // snap to 1 mm so equal edges sort/compare exactly

export function convexHull(points) {
  if (points.length < 3) return points.slice()
  const k = Math.cos(rad(points[0].lat))
  const o = points[0]
  // local metres (small numbers) so floating-point noise can't keep collinear edge points
  const P = points.map((p) => ({ ...p, x: mm((p.lng - o.lng) * k * 111_320), y: mm((p.lat - o.lat) * 111_320) })).sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower = []
  for (const p of P) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 1e-6) lower.pop()
    lower.push(p)
  }
  const upper = []
  for (const p of [...P].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 1e-6) upper.pop()
    upper.push(p)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)].map(({ lat, lng }) => ({ lat, lng }))
}
