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
  // monthly global horizontal irradiation, kWh/m²/day — NASA POWER climatology, Chiang Mai cell (fetched 2026-09-25)
  ghiMonthly: [4.64, 5.34, 5.65, 6.02, 5.38, 4.58, 4.22, 4.09, 4.45, 4.41, 4.58, 4.36],
  diffuseFraction: 0.49, // NASA POWER: diffuse 2.34 ÷ global 4.80 kWh/m²/day (annual) — hazy tropical sky
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

  // --- the equipment the company installs today (owner, 2026-09-25) ---------
  // Google's Solar API sizes layouts with its own 400 W · 1.879 × 1.045 m panel; we convert by roof area (layout.js)
  // JA Solar JAM66D45-625/LB (n-type TOPCon, bifacial 80 %) — specs per ComparePV / jasolar.eu; confirm with the supplier datasheet
  panel: { model: 'JA Solar JAM66D45-625/LB', wp: 625, sizeM: [2.382, 1.134], gammaPmax: -0.0029, noctC: 45 },
  // Huawei SUN2000-5K/6K/8K/10K/12K-MAP0 (datasheet 02-202406): 5,000 W rated, 97.5 % European weighted efficiency
  inverter: { model: 'Huawei SUN2000-MAP0', sizesKw: [5, 6, 8, 10, 12], efficiency: 0.975, maxDcAc: 1.3 },
  // DC-side losses: soiling ~3 % (dry-season dust) + cables ~1.5 % + mismatch ~1 % + low light ~1 % + first-year degradation ~1 %
  // ≈ 7.5 %; glass reflection is modelled by sun angle (seasons.js), heat by cell temperature, the inverter by its efficiency.
  // Industry-typical values (PVGIS recommends ~14 % total system loss incl. inverter) — draft until checked against real yields
  dcLosses: 0.075,

  // --- product defaults ------------------------------------------------------
  standardInverterKw: [3, 5, 6, 8, 10, 12, 15, 20],
  standardBreakersA: [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125],
}

/** merge user overrides on top of the defaults (shallow) */
export const withDefaults = (over = {}) => ({ ...DEFAULTS, ...over })

/** average daily GHI over the year (kWh/m²/day) */
export const ghiAnnualAvg = (a = DEFAULTS) => a.ghiMonthly.reduce((s, v) => s + v, 0) / a.ghiMonthly.length
