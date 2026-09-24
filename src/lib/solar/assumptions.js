/**
 * Default assumptions for every Solar Builder calculation.
 * Rule: nothing is hidden — the UI shows these values next to each result and the
 * tech mode lets the user override them. Values marked `draft` must be verified by
 * the owner before production (see SOLAR_BUILDER_PLAN.md §5.4 / S4.5).
 */
export const DEFAULTS = {
  // --- energy / tariff -------------------------------------------------------
  tariffThbPerKwh: 4.4, // PEA residential average incl. Ft + VAT (approx.) — draft
  dayShare: 0.6, // share of consumption during sun hours
  performanceRatio: 0.8, // all system losses (temperature, soiling, cable, inverter)

  // --- climate (Chiang Mai / upper north) ------------------------------------
  latitude: 18.79,
  // monthly global horizontal irradiation, kWh/m²/day — draft, verify (PVGIS / DEDE solar map)
  ghiMonthly: [4.9, 5.5, 5.9, 6.2, 5.7, 4.9, 4.5, 4.4, 4.6, 4.7, 4.6, 4.5],
  diffuseFraction: 0.4, // tropical haze → higher diffuse share than temperate climates
  albedo: 0.2,
  tMinC: 5, // record-low ambient for Voc(max) — conservative for the north; override for doi sites
  tCellMaxC: 70, // hot cell temperature for Vmp(min)

  // --- design limits ---------------------------------------------------------
  dcAcWarnHigh: 1.3, // PV kWp / inverter kW above this → clipping warning
  dcAcInfoLow: 0.8, // below this → inverter oversized (info)
  dcCurrentFactor: 1.56, // 1.25 continuous × 1.25 irradiance — draft (confirm with วสท./IEC 62548)
  acBreakerFactor: 1.25,
  vdropWarnPctDc: 2,
  vdropWarnPctAc: 2,
  copperResistivity: 0.0225, // Ω·mm²/m at ~70 °C (conservative)
  acVoltage1ph: 230,
  acVoltage3ph: 400,

  // --- product defaults ------------------------------------------------------
  standardInverterKw: [3, 5, 6, 8, 10, 12, 15, 20],
  standardBreakersA: [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125],
}

/** merge user overrides on top of the defaults (shallow) */
export const withDefaults = (over = {}) => ({ ...DEFAULTS, ...over })

/** average daily GHI over the year (kWh/m²/day) */
export const ghiAnnualAvg = (a = DEFAULTS) => a.ghiMonthly.reduce((s, v) => s + v, 0) / a.ghiMonthly.length
