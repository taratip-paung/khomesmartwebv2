import { withDefaults, ghiAnnualAvg } from './assumptions.js'

/**
 * Simplified yearly yield model — good enough to TEACH the effect of orientation
 * (south vs east/west vs north, tilt) and to give a first estimate. Not a bankable yield study.
 * Method: sweep the sun over the year (every 3 days, 15-min steps), split a clear-sky proxy
 * into beam + isotropic diffuse + ground-reflected parts, and compare plane-of-array vs horizontal.
 */
const rad = (d) => (d * Math.PI) / 180
const deg = (r) => (r * 180) / Math.PI

/** solar declination (radians) — NOAA / Spencer (1971) Fourier series, ±0.03° (the old one-term formula was off by up to ~1°) */
export function declination(dayOfYear, solarHour = 12) {
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (solarHour - 12) / 24)
  return (
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g)
  )
}

/** Sun position. dayOfYear 1–365, solarHour 0–24 (local solar time).
 *  Returns elevation (°, geometric — no refraction) and azimuth (° from north, clockwise). */
export function sunPosition(latDeg, dayOfYear, solarHour) {
  const phi = rad(latDeg)
  const decl = declination(dayOfYear, solarHour)
  const omega = rad(15 * (solarHour - 12))
  const sinEl = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(omega)
  const el = Math.asin(Math.max(-1, Math.min(1, sinEl)))
  const cosAz = (Math.sin(decl) - Math.sin(el) * Math.sin(phi)) / (Math.cos(el) * Math.cos(phi))
  let az = deg(Math.acos(Math.max(-1, Math.min(1, cosAz))))
  if (omega > 0) az = 360 - az
  return { elevation: deg(el), azimuth: az }
}

/** cos of the angle between the sun and the panel normal */
export function cosIncidence(sun, tiltDeg, surfaceAzDeg) {
  const el = rad(sun.elevation)
  const b = rad(tiltDeg)
  return Math.sin(el) * Math.cos(b) + Math.cos(el) * Math.sin(b) * Math.cos(rad(sun.azimuth - surfaceAzDeg))
}

/**
 * Ratio of yearly plane-of-array irradiation to horizontal irradiation.
 * 1.00 = same as a flat roof. azimuth: 180 = facing south.
 */
export function transpositionFactor({ latitude, tilt, azimuth, assumptions } = {}) {
  const a = withDefaults(assumptions)
  const lat = latitude ?? a.latitude
  const df = a.diffuseFraction
  const b = rad(tilt)
  let poa = 0
  let ghi = 0
  for (let n = 1; n <= 365; n += 3) {
    for (let h = 5; h <= 19; h += 0.25) {
      const sun = sunPosition(lat, n, h)
      if (sun.elevation <= 0) continue
      const sinEl = Math.sin(rad(sun.elevation))
      const g = Math.pow(sinEl, 1.15) // clear-sky proxy
      const gb = (1 - df) * g
      const gd = df * g
      const ci = Math.max(0, cosIncidence(sun, tilt, azimuth))
      poa += (gb * ci) / sinEl + (gd * (1 + Math.cos(b))) / 2 + (g * a.albedo * (1 - Math.cos(b))) / 2
      ghi += g
    }
  }
  return poa / ghi
}

/** Yearly AC energy (kWh) for a PV array described by kWp + orientation. */
export function annualYield({ kwp, tilt = 0, azimuth = 180, latitude, assumptions } = {}) {
  const a = withDefaults(assumptions)
  const factor = transpositionFactor({ latitude, tilt, azimuth, assumptions: a })
  const kwhPerKwp = ghiAnnualAvg(a) * 365 * factor * a.performanceRatio
  return { factor, kwhPerKwp, kwh: kwp * kwhPerKwp }
}

/**
 * Same thing from Google Solar API data: a roof segment's yearly sunshine
 * (kWh/m²/year on that plane, i.e. peak-sun-hours per year) already includes orientation
 * and nearby shading → do NOT apply the transposition factor again.
 */
export function annualYieldFromSunshine({ kwp, sunshineHoursPerYear, assumptions } = {}) {
  const a = withDefaults(assumptions)
  const kwhPerKwp = sunshineHoursPerYear * a.performanceRatio
  return { kwhPerKwp, kwh: kwp * kwhPerKwp }
}

/** Compass label for an azimuth (° from north) — used by UI + น้องบี */
export function compass8(az) {
  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return names[Math.round((((az % 360) + 360) % 360) / 45) % 8]
}
