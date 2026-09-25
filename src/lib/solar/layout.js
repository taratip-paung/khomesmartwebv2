/**
 * Google's panel layouts (buildingInsights solarPanelConfigs) turned into teaching numbers for OUR panel.
 *
 * Google sizes every layout with its own panel (default 400 W, 1.879 × 1.045 m). The company installs a
 * different panel (DEFAULTS.panel: 650 W, 2.2 × 1.1 m), so a layout is converted BY ROOF AREA:
 *   area  = Google panels × Google panel area
 *   ours  = floor(area / our panel area)
 *   energy (AC) = Google DC energy × DC_TO_AC × (our watts on that area / Google watts on that area)
 * Google fills the roof best-spot-first (sunniest, least shaded first), so each extra panel adds a bit LESS
 * energy than the one before — more panels ≠ proportionally more energy.
 * DC_TO_AC 0.85 = the derate Google's own Solar API examples use. Draft: confirm against real systems (S4.6).
 */
import { DEFAULTS } from './assumptions.js'

export const DC_TO_AC = 0.85
const area = ([a, b]) => a * b

/** how many of OUR panels fit on the roof area Google's `n` panels cover */
export const oursFromGoogle = (n, gSize = [1.879, 1.045], panel = DEFAULTS.panel) => Math.floor((n * area(gSize)) / area(panel.sizeM) + 1e-9)

/**
 * [[googleN, dcKwh]] → [{ m (our panels), n (Google panels), kwp, kwh (AC/yr), areaM2 }], starting at 0,
 * one point per distinct m.
 */
export function layoutCurve(configs = [], { gW = 400, gSize = [1.879, 1.045], panel = DEFAULTS.panel } = {}) {
  const out = [{ m: 0, n: 0, kwp: 0, kwh: 0, areaM2: 0 }]
  const sorted = configs.filter(([n, kwh]) => n > 0 && kwh > 0).sort((a, b) => a[0] - b[0])
  for (const [n, dc] of sorted) {
    const m = oursFromGoogle(n, gSize, panel)
    if (m <= out[out.length - 1].m) continue
    const kwh = dc * DC_TO_AC * ((m * panel.wp) / (n * gW))
    out.push({ m, n, kwp: (m * panel.wp) / 1000, kwh, areaM2: m * area(panel.sizeM) })
  }
  return out.length > 1 ? out : []
}

const interp = (curve, m, key) => {
  if (!curve.length || m <= 0) return 0
  const last = curve[curve.length - 1]
  if (m >= last.m) return last[key]
  const i = curve.findIndex((p) => p.m >= m)
  const a = curve[i - 1]
  const b = curve[i]
  return a[key] + ((b[key] - a[key]) * (m - a.m)) / (b.m - a.m)
}

/** AC kWh/yr for `m` of our panels (linear between Google's layouts) */
export const kwhFor = (curve, m) => interp(curve, m, 'kwh')
/** how many Google panels to outline on the map for `m` of ours */
export const googleCountFor = (curve, m) => Math.round(interp(curve, m, 'n'))
/** energy the m-th panel adds (kWh/yr) */
export const marginal = (curve, m) => kwhFor(curve, m) - kwhFor(curve, m - 1)

/**
 * default panel count = the company's standard set (DEFAULTS.standardPanels: 8 × 625 W on a Huawei 5K),
 * capped at what Google says fits on this roof
 */
export function defaultPanels(curve, count = DEFAULTS.standardPanels) {
  if (!curve.length) return null
  return Math.min(count, curve[curve.length - 1].m)
}

/** layouts available (for a stepped slider), in our panels */
export const layoutSteps = (curve) => curve.filter((p) => p.m > 0).map((p) => p.m)
