/**
 * Thai seasons + hour-by-hour PV production for the Solar Builder "first look" step.
 * Physical model on REAL climate data (see climate.js / data/solar/climateCM.js):
 *   sun position (NOAA) → clear-sky (Ineichen + monthly haze) or the month's average sky (NASA POWER)
 *   → panel plane (tilt/facing) → cell temperature (PVGIS hourly air temp + NOCT) → panel (JA 625 W, −0.29 %/°C)
 *   → DC losses → inverter efficiency + clipping (Huawei SUN2000-MAP0).
 * Still a learning estimate — the team surveys every site before designing.
 */
import { DEFAULTS, withDefaults } from './assumptions.js'
import { sunPosition, cosIncidence } from './production.js'
import { ineichen, monthOfDay, MID_DAY } from './climate.js'
import { clockFromSolar } from './geo.js'
import { CLIMATE_CM } from '../../data/solar/climateCM.js'

const rad = (d) => (d * Math.PI) / 180
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MONTH_START = MONTH_DAYS.reduce((a, d, i) => (a.push(i ? a[i - 1] + MONTH_DAYS[i - 1] : 1), a), [])

/**
 * Thai Meteorological Department seasons (approx. — TMD dates run mid-month to mid-month;
 * we group whole months so the numbers add up to the year):
 *   hot  ฤดูร้อน  Mar–May · rainy ฤดูฝน Jun–Oct · cool ฤดูหนาว Nov–Feb
 * `day` = day of year in the middle of the season (drives the sun path + daily curve).
 */
export const SEASONS = {
  hot: { months: [2, 3, 4], day: 105 }, // 15 Apr
  rainy: { months: [5, 6, 7, 8, 9], day: 227 }, // 15 Aug
  cool: { months: [10, 11, 0, 1], day: 1 }, // 1 Jan
}
export const SEASON_ORDER = ['hot', 'rainy', 'cool']

/** which season a day of year falls in */
export function seasonOfDay(day) {
  const m = MONTH_START.findLastIndex((s) => day >= s)
  return SEASON_ORDER.find((k) => SEASONS[k].months.includes(m)) ?? 'cool'
}

/* ---------------------------------------------------------------- physical hour-by-hour model */

/** which inverter size (kW AC) goes with a PV array — smallest standard size with DC/AC ≤ 1.3 */
export function pickInverterKw(kwp, a = DEFAULTS) {
  const sizes = a.inverter.sizesKw
  return sizes.find((kw) => kwp / kw <= a.inverter.maxDcAc) ?? sizes[sizes.length - 1]
}

/**
 * Irradiance on the panel plane (W/m²) at one moment.
 * kind 'clear': Ineichen clear sky with the month's Linke turbidity (haze included).
 * kind 'avg'  : the month's average day = clear sky × (measured all-sky ÷ clear-sky), diffuse share from NASA.
 * Transposition: isotropic sky (diffuse) + ground reflection; reflection losses by incidence angle (IAM).
 */
function poa({ sun, day, tilt, azimuth, climate: c, kind, albedo }) {
  if (sun.elevation <= 0) return { w: 0, raw: 0 }
  const m = monthOfDay(day)
  const cs = ineichen(sun.elevation, c.tl[m], day, c.alt)
  const cz = Math.sin(rad(sun.elevation))
  let ghi = cs.ghi
  let dhi = cs.dhi
  let dni = cs.dni
  if (kind === 'avg') {
    ghi = cs.ghi * (c.ghi[m] / c.clr[m])
    dhi = ghi * Math.min(1, c.dif[m] / c.ghi[m])
    dni = cz > 0.02 ? (ghi - dhi) / cz : 0
  }
  const b = rad(tilt)
  const ci = Math.max(0, cosIncidence(sun, tilt, azimuth))
  // glass reflects more at steep angles (ASHRAE incidence-angle modifier, b0 = 0.05) — mornings/evenings lose more than noon
  const iam = ci > 0.1 ? Math.max(0, 1 - 0.05 * (1 / ci - 1)) : 0
  const skyIam = 0.95 // diffuse light arrives from all angles
  const sky = (dhi * (1 + Math.cos(b))) / 2 + (ghi * albedo * (1 - Math.cos(b))) / 2
  return { w: dni * ci * iam + sky * skyIam, raw: dni * ci + sky } // raw = before glass reflection (to compare with PVGIS G(i))
}

/**
 * AC power (kW) of a `kwp` array from plane-of-array irradiance and air temperature:
 *   cell temperature  Tc = Tair + (NOCT − 20) / 800 × POA          (NOCT model)
 *   DC power          kWp × POA/1000 × (1 + γ·(Tc − 25)) × (1 − DC losses)
 *   AC power          min(inverter kW, DC × inverter efficiency)   (clipping at the inverter rating)
 */
export function acPower({ poaW, tAir, kwp, invKw = Infinity, a = DEFAULTS }) {
  if (poaW <= 0) return 0
  const tc = tAir + ((a.panel.noctC - 20) / 800) * poaW
  const dc = kwp * (poaW / 1000) * (1 + a.panel.gammaPmax * (tc - 25)) * (1 - a.dcLosses)
  return Math.max(0, Math.min(invKw, dc * a.inverter.efficiency))
}

/**
 * Power through one day, `stepH` hours apart (solar time), for the whole `kwp` array.
 * kind: 'clear' (sunny all day) or 'avg' (the month's average day, cloudy + rainy days included).
 */
export function dayCurve({ kind = 'avg', latitude, lng, day, tilt, azimuth, kwp = 1, invKw = Infinity, climate = CLIMATE_CM, stepH = 0.25, assumptions } = {}) {
  const a = withDefaults(assumptions)
  const lat = latitude ?? climate.lat
  const lon = lng ?? climate.lng
  const m = monthOfDay(day)
  const pts = []
  for (let h = 5; h <= 19.0001; h += stepH) {
    const sun = sunPosition(lat, day, h)
    const { w: poaW, raw } = poa({ sun, day, tilt, azimuth, climate, kind, albedo: a.albedo })
    const clock = ((Math.floor(clockFromSolar(h, lon, day)) % 24) + 24) % 24
    const tAir = climate.tHourly[m][clock] ?? climate.t2m[m]
    pts.push({ h: +h.toFixed(4), kw: acPower({ poaW, tAir, kwp, invKw, a }), poa: raw })
  }
  return pts
}

/** kWh per kWp for each month (12 values): the month's average day × days (no clipping — per kWp) */
export function monthlyYield({ tilt = 10, azimuth = 180, latitude, lng, climate = CLIMATE_CM, assumptions } = {}) {
  return MONTH_DAYS.map((days, m) => {
    const c = dayCurve({ kind: 'avg', latitude, lng, day: MID_DAY[m], tilt, azimuth, kwp: 1, climate, assumptions })
    return curveEnergy(c) * days
  })
}

/**
 * Energy per season for `kwp`. `annualKwhPerKwp` (e.g. from Google Solar API — includes this roof's shading)
 * rescales the model so the year matches while keeping the seasonal split; `scale` is returned for the curves.
 */
export function seasonYield({ kwp = 1, tilt, azimuth, latitude, lng, annualKwhPerKwp, climate = CLIMATE_CM, assumptions } = {}) {
  const months = monthlyYield({ tilt, azimuth, latitude, lng, climate, assumptions })
  const year = months.reduce((s, v) => s + v, 0)
  const k = annualKwhPerKwp ? annualKwhPerKwp / year : 1
  const out = {}
  for (const key of SEASON_ORDER) {
    const ms = SEASONS[key].months
    const kwhPerKwp = ms.reduce((s, m) => s + months[m], 0) * k
    const days = ms.reduce((s, m) => s + MONTH_DAYS[m], 0)
    out[key] = { kwh: kwhPerKwp * kwp, perDay: (kwhPerKwp * kwp) / days, days, share: kwhPerKwp / (year * k) || 0 }
  }
  return { seasons: out, yearKwh: year * k * kwp, modelKwhPerKwp: year, scale: k }
}

/**
 * Performance ratio of this model for one orientation: AC energy ÷ (plane-of-array kWh/m² × kWp).
 * Used to turn Google's roof-face sunshine (kWh/m²/yr on that face, shading included) into kWh per kWp consistently.
 */
export function effectivePR({ tilt, azimuth, latitude, lng, climate = CLIMATE_CM, assumptions } = {}) {
  let e = 0
  let p = 0
  MONTH_DAYS.forEach((days, m) => {
    const c = dayCurve({ kind: 'avg', latitude, lng, day: MID_DAY[m], tilt, azimuth, kwp: 1, climate, assumptions })
    e += curveEnergy(c) * days
    p += (c.reduce((s, q) => s + q.poa * 0.25, 0) / 1000) * days // raw plane-of-array (Google's flux is before reflection too)
  })
  return p ? e / p : 0.8
}

/** energy under a curve (kWh) */
export const curveEnergy = (curve, stepH = 0.25) => curve.reduce((s, p) => s + p.kw * stepH, 0)

/** power at an arbitrary solar hour (linear interpolation on a curve) */
export function curveAt(curve, h) {
  if (!curve.length || h <= curve[0].h || h >= curve[curve.length - 1].h) return 0
  const i = curve.findIndex((p) => p.h >= h)
  const p0 = curve[i - 1]
  const p1 = curve[i]
  return p0.kw + ((p1.kw - p0.kw) * (h - p0.h)) / (p1.h - p0.h)
}

/**
 * Where the sun rises/sets and how high it gets at noon — the "direction of sunlight" for a season.
 * Sunrise/sunset = the sun's upper edge on the horizon, as almanacs define it: centre at −0.833°
 * (0.567° refraction + 0.267° half-disc). Checked against sunrise-sunset.org for Chiang Mai (±1 min).
 */
export const HORIZON_DEG = -0.833
export function sunFacts(latitude, day) {
  let rise = null
  let set = null
  let prev = sunPosition(latitude, day, 4)
  for (let h = 4.005; h <= 20; h += 0.005) {
    const s = sunPosition(latitude, day, h)
    if (rise == null && prev.elevation <= HORIZON_DEG && s.elevation > HORIZON_DEG) rise = { h, az: s.azimuth }
    if (rise != null && prev.elevation > HORIZON_DEG && s.elevation <= HORIZON_DEG) set = { h, az: prev.azimuth }
    prev = s
  }
  const noon = sunPosition(latitude, day, 12.0001)
  return { rise, set, noon, dayLength: rise && set ? set.h - rise.h : 0 }
}
