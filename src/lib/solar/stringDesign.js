import { withDefaults } from './assumptions.js'

/**
 * PV string design checks (tech mode). Every issue has a stable `key` that maps to an
 * explanation in src/data/solar/explain.js (so น้องบี can explain it) + the numbers used.
 *
 * Severity rule (SOLAR_BUILDER_PLAN §1.4): anything that can damage equipment or is unsafe
 * is an `error` (cannot continue); performance problems are `warning`.
 */

/** panel voltage at a temperature (°C), linear temperature coefficient in %/°C */
export const vocAt = (panel, t) => panel.voc * (1 + (panel.tcVoc / 100) * (t - 25))
// Vmp moves with roughly the Pmax coefficient; fall back to Voc coefficient if not given
export const vmpAt = (panel, t) => panel.vmp * (1 + ((panel.tcVmp ?? panel.tcPmax ?? panel.tcVoc) / 100) * (t - 25))

/** MPPT spec for index i — inverters may have different limits per MPPT */
export const mpptSpec = (inverter, i = 0) => ({ ...inverter.mppt, ...(inverter.mpptOverrides?.[i] ?? {}) })

/** Allowed number of panels in series for one MPPT */
export function seriesLimits(panel, inverter, { assumptions, mpptIndex = 0 } = {}) {
  const a = withDefaults(assumptions)
  const m = mpptSpec(inverter, mpptIndex)
  const vocCold = vocAt(panel, a.tMinC)
  const vmpHot = vmpAt(panel, a.tCellMaxC)
  const vmpCold = vmpAt(panel, a.tMinC)
  return {
    vocCold,
    vmpHot,
    vmpCold,
    maxSeries: Math.floor(inverter.vdcMax / vocCold), // hard limit (safety)
    minSeries: Math.ceil(m.vMin / vmpHot), // below this the MPPT drops out on hot days
    maxSeriesMppt: Math.floor(m.vMax / vmpCold), // above this MPPT tracking clips on cold mornings
  }
}

/**
 * Check one MPPT input: `series` panels per string, `parallel` strings on this MPPT.
 * Returns { issues[], values{} }.
 */
export function checkMpptInput({ panel, inverter, series, parallel = 1, mpptIndex = 0, assumptions }) {
  const a = withDefaults(assumptions)
  const m = mpptSpec(inverter, mpptIndex)
  const lim = seriesLimits(panel, inverter, { assumptions: a, mpptIndex })
  const v = {
    vocColdString: series * lim.vocCold,
    vmpHotString: series * lim.vmpHot,
    vmpColdString: series * lim.vmpCold,
    vocStcString: series * panel.voc,
    iscTotal: parallel * panel.isc,
    impTotal: parallel * panel.imp,
    kwp: (series * parallel * panel.wp) / 1000,
  }
  const issues = []
  const add = (level, key, params = {}) => issues.push({ level, key, params: { mppt: mpptIndex + 1, ...params } })

  if (series < 1) return { issues, values: v, limits: lim }
  if (v.vocColdString > inverter.vdcMax)
    add('error', 'voc_over_max', { voc: v.vocColdString, max: inverter.vdcMax, t: a.tMinC, maxSeries: lim.maxSeries })
  if (v.iscTotal > m.iscMax) add('error', 'isc_over_max', { isc: v.iscTotal, max: m.iscMax })
  if (v.vmpHotString < m.vMin) add('warning', 'vmp_below_mppt', { vmp: v.vmpHotString, min: m.vMin, minSeries: lim.minSeries })
  if (v.vmpColdString > m.vMax) add('warning', 'vmp_above_mppt', { vmp: v.vmpColdString, max: m.vMax })
  if (inverter.vStart && v.vocStcString < inverter.vStart) add('warning', 'below_start_voltage', { voc: v.vocStcString, start: inverter.vStart })
  if (v.impTotal > m.iMax) add('warning', 'imp_over_mppt', { imp: v.impTotal, max: m.iMax })
  return { issues, values: v, limits: lim }
}

/** Check a whole array: inputs = [{ mpptIndex, series, parallel }] */
export function checkArray({ panel, inverter, inputs, assumptions }) {
  const a = withDefaults(assumptions)
  const issues = []
  const perMppt = []
  let kwp = 0
  if (inputs.length > inverter.mpptCount) issues.push({ level: 'error', key: 'too_many_mppt', params: { used: inputs.length, max: inverter.mpptCount } })
  for (const inp of inputs) {
    const r = checkMpptInput({ panel, inverter, assumptions: a, ...inp })
    perMppt.push(r)
    issues.push(...r.issues)
    kwp += r.values.kwp
  }
  const ratio = kwp / (inverter.acW / 1000)
  if (ratio > a.dcAcWarnHigh) issues.push({ level: 'warning', key: 'dcac_high', params: { ratio } })
  if (ratio < a.dcAcInfoLow) issues.push({ level: 'info', key: 'dcac_low', params: { ratio } })
  return { issues, perMppt, kwp, dcAcRatio: ratio }
}

/**
 * Suggest a split of `panels` across the inverter's MPPTs, respecting series limits.
 * Returns inputs[] or null if impossible (then the UI explains why).
 */
export function suggestStrings({ panel, inverter, panels, assumptions }) {
  const lim = seriesLimits(panel, inverter, { assumptions })
  const hi = Math.min(lim.maxSeries, lim.maxSeriesMppt)
  const lo = lim.minSeries
  if (hi < lo) return null
  // prefer one string per MPPT, equal lengths, as long as possible within limits
  for (let strings = 1; strings <= inverter.mpptCount * 2; strings++) {
    if (panels % strings) continue
    const series = panels / strings
    if (series < lo || series > hi) continue
    const perMppt = Math.ceil(strings / inverter.mpptCount)
    const inputs = []
    let left = strings
    for (let i = 0; i < inverter.mpptCount && left > 0; i++) {
      const p = Math.min(perMppt, left)
      inputs.push({ mpptIndex: i, series, parallel: p })
      left -= p
    }
    const r = checkArray({ panel, inverter, inputs, assumptions })
    if (!r.issues.some((x) => x.level === 'error')) return inputs
  }
  // odd counts: one string per MPPT with different lengths (e.g. 11 = 6 + 5) — each MPPT tracks on its own
  if (inverter.mpptCount >= 2) {
    for (let a1 = Math.ceil(panels / 2); a1 <= Math.min(hi, panels - lo); a1++) { // most balanced first
      const b1 = panels - a1
      if (b1 < lo || b1 > hi) continue
      const inputs = [{ mpptIndex: 0, series: a1, parallel: 1 }, { mpptIndex: 1, series: b1, parallel: 1 }]
      const r = checkArray({ panel, inverter, inputs, assumptions })
      if (!r.issues.some((x) => x.level === 'error')) return inputs
    }
  }
  return null
}
