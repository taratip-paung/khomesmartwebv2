/**
 * Climate data for the production model — from REAL datasets, no hand-typed guesses:
 *   NASA POWER climatology (monthly, ~0.5° grid): all-sky GHI, clear-sky GHI (includes MERRA-2 aerosols → haze),
 *     diffuse, mean air temperature
 *   PVGIS-ERA5 daily profiles (monthly, 0.25° grid, 2005–2023): hourly air temperature, site elevation
 *     (SARAH-3 satellite data does not cover Chiang Mai — PVGIS answers "out of coverage")
 * Clear-sky irradiance: Ineichen–Perez model with a monthly Linke turbidity calibrated so the daily clear-sky total
 * matches NASA's clear-sky value → haze (Feb–Apr burning season) lowers mornings/evenings more than noon, as in reality.
 * Shared by the browser (built-in Chiang Mai table) and the backend (/api/solar/climate, cached per grid cell).
 */
import { sunPosition } from './production.js'

const rad = (d) => (d * Math.PI) / 180
export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
export const MID_DAY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]
const MONTH_START = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]
export const monthOfDay = (day) => MONTH_START.findLastIndex((s) => day >= s)

/** Ineichen–Perez clear sky (as in pvlib). el = sun elevation (°), TL = Linke turbidity, alt = site elevation (m). W/m² */
export function ineichen(el, TL, day, alt = 300) {
  if (el <= 0) return { ghi: 0, dni: 0, dhi: 0 }
  const cz = Math.sin(rad(el))
  const zen = 90 - el
  const am = 1 / (cz + 0.50572 * Math.pow(96.07995 - zen, -1.6364)) // Kasten–Young air mass
  const I0 = 1367 * (1 + 0.033 * Math.cos((2 * Math.PI * day) / 365))
  const fh1 = Math.exp(-alt / 8000)
  const fh2 = Math.exp(-alt / 1250)
  const cg1 = 5.09e-5 * alt + 0.868
  const cg2 = 3.92e-5 * alt + 0.0387
  const ghi = Math.max(0, cg1 * I0 * cz * Math.exp(-cg2 * am * (fh1 + fh2 * (TL - 1))) * Math.exp(0.01 * Math.pow(am, 1.8)))
  const b = 0.664 + 0.163 / fh1
  const dni = Math.min(Math.max(0, b * I0 * Math.exp(-0.09 * am * (TL - 1))), ghi / cz)
  return { ghi, dni, dhi: Math.max(0, ghi - dni * cz) }
}

/** daily clear-sky GHI (kWh/m²) for a day and turbidity */
export function clearDayGhi(lat, day, TL, alt) {
  let s = 0
  for (let h = 4; h <= 20; h += 0.05) s += ineichen(sunPosition(lat, day, h).elevation, TL, day, alt).ghi * 0.05
  return s / 1000
}

/** Linke turbidity per month so that Ineichen's daily total = the measured clear-sky total (kWh/m²/day) */
export function calibrateTL(lat, clr, alt) {
  return clr.map((target, m) => {
    let lo = 1
    let hi = 12
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2
      if (clearDayGhi(lat, MID_DAY[m], mid, alt) > target) lo = mid
      else hi = mid
    }
    return +((lo + hi) / 2).toFixed(3)
  })
}

/** NASA POWER climatology JSON → monthly arrays */
export function parseNasa(json) {
  const p = json?.properties?.parameter
  if (!p?.ALLSKY_SFC_SW_DWN) throw new Error('nasa: unexpected response')
  const arr = (k) => MONTHS.map((m) => +p[k][m])
  return { ghi: arr('ALLSKY_SFC_SW_DWN'), clr: arr('CLRSKY_SFC_SW_DWN'), dif: arr('ALLSKY_SFC_SW_DIFF'), t2m: arr('T2M') }
}

/** PVGIS DRcalc JSON (month=0, showtemperatures=1) → hourly air temperature per month in LOCAL clock hours + elevation */
export function parsePvgis(json, tzHours = 7) {
  const rows = json?.outputs?.daily_profile
  if (!rows?.length) throw new Error('pvgis: unexpected response')
  const tHourly = Array.from({ length: 12 }, () => Array(24).fill(null))
  for (const r of rows) {
    const utcH = +r.time.slice(0, 2)
    tHourly[r.month - 1][(utcH + tzHours) % 24] = +r.T2m
  }
  return { tHourly, alt: +json.inputs.location.elevation, db: json.inputs.meteo_data?.radiation_db }
}

/** everything the production model needs for one place */
export function buildClimate({ lat, lng, nasa, pvgis, cell = null }) {
  const n = parseNasa(nasa)
  const p = parsePvgis(pvgis)
  return {
    lat,
    lng,
    cell,
    alt: p.alt,
    ...n,
    tHourly: p.tHourly,
    tl: calibrateTL(lat, n.clr, p.alt),
    source: `NASA POWER climatology + ${p.db ?? 'PVGIS'} (2005–2023)`,
  }
}

/** grid cell used to cache climate on the server (0.25° ≈ 27 km — the ERA5 grid) */
export const climateCell = (lat, lng) => {
  const q = (v) => (Math.round(v * 4) / 4).toFixed(2)
  return { key: `${q(lat)},${q(lng)}`, lat: +q(lat), lng: +q(lng) }
}

/** request URLs (server side only — both services are free, no key) */
export const climateUrls = (lat, lng) => ({
  nasa: `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DIFF,T2M&community=RE&longitude=${lng}&latitude=${lat}&format=JSON`,
  pvgis: `https://re.jrc.ec.europa.eu/api/v5_3/DRcalc?lat=${lat}&lon=${lng}&month=0&angle=0&aspect=0&global=1&showtemperatures=1&outputformat=json`,
})
