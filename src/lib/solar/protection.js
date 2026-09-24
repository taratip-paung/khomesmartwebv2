import { withDefaults } from './assumptions.js'

/**
 * Cables, breakers and surge protection (tech mode).
 * AMPACITY values are DRAFT placeholders for the teaching model — the owner must replace them
 * with the table the company designs to (มอก./วสท., install method, grouping, ambient) — S4.5.
 */
export const AMPACITY = {
  status: 'draft',
  // copper, A — PV1-F single core in free air / on tray
  pvCable: { 4: 55, 6: 70, 10: 98 },
  // copper THW/IEC 60227 in conduit, 2 loaded conductors, 30 °C
  acConduit: { 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125 },
}

/** design current for a PV string/array circuit */
export const dcDesignCurrent = (iscTotal, a = withDefaults()) => iscTotal * a.dcCurrentFactor

/** smallest cable size (mm²) whose ampacity ≥ current */
export function selectCable(currentA, table) {
  const sizes = Object.keys(table).map(Number).sort((x, y) => x - y)
  const s = sizes.find((mm2) => table[mm2] >= currentA)
  return s == null ? null : { mm2: s, ampacity: table[s] }
}

/**
 * Voltage drop in %. kind: 'dc' | '1ph' | '3ph'. lengthM = one-way route length.
 */
export function voltageDropPct({ currentA, lengthM, mm2, voltage, kind = 'dc', assumptions }) {
  const a = withDefaults(assumptions)
  const r = (a.copperResistivity * lengthM) / mm2 // Ω per conductor
  const vd = kind === '3ph' ? Math.sqrt(3) * currentA * r : 2 * currentA * r
  return (vd / voltage) * 100
}

/** next standard breaker ≥ factor × current */
export function selectBreaker(currentA, assumptions) {
  const a = withDefaults(assumptions)
  const need = currentA * a.acBreakerFactor
  return { need, rating: a.standardBreakersA.find((x) => x >= need) ?? null }
}

/**
 * Size the AC output circuit of the inverter.
 * Checks: breaker ≤ cable ampacity (error: cable would not be protected), voltage drop (warning).
 */
export function acCircuit({ inverter, lengthM = 10, assumptions }) {
  const a = withDefaults(assumptions)
  const issues = []
  const iMax = inverter.acMaxA
  const br = selectBreaker(iMax, a)
  const cable = selectCable(Math.max(br.rating ?? 0, iMax), AMPACITY.acConduit)
  if (!br.rating) issues.push({ level: 'error', key: 'no_breaker_size', params: { need: br.need } })
  if (!cable) issues.push({ level: 'error', key: 'no_cable_size', params: { current: br.rating } })
  const voltage = inverter.phase === 3 ? a.acVoltage3ph : a.acVoltage1ph
  const vd = cable ? voltageDropPct({ currentA: iMax, lengthM, mm2: cable.mm2, voltage, kind: inverter.phase === 3 ? '3ph' : '1ph', assumptions: a }) : null
  if (vd != null && vd > a.vdropWarnPctAc) issues.push({ level: 'warning', key: 'vdrop_ac', params: { pct: vd, max: a.vdropWarnPctAc } })
  if (cable && br.rating > cable.ampacity) issues.push({ level: 'error', key: 'breaker_exceeds_cable', params: { breaker: br.rating, ampacity: cable.ampacity } })
  return { breaker: br, cable, voltageDropPct: vd, issues }
}

/** DC circuit per MPPT input */
export function dcCircuit({ iscTotal, vmpString, parallel = 1, lengthM = 20, assumptions }) {
  const a = withDefaults(assumptions)
  const issues = []
  const iDesign = dcDesignCurrent(iscTotal, a)
  const cable = selectCable(iDesign / Math.max(1, parallel), AMPACITY.pvCable) // each string has its own pair
  if (!cable) issues.push({ level: 'error', key: 'no_cable_size', params: { current: iDesign } })
  const vd = cable ? voltageDropPct({ currentA: iscTotal / Math.max(1, parallel), lengthM, mm2: cable.mm2, voltage: vmpString, kind: 'dc', assumptions: a }) : null
  if (vd != null && vd > a.vdropWarnPctDc) issues.push({ level: 'warning', key: 'vdrop_dc', params: { pct: vd, max: a.vdropWarnPctDc } })
  // 3+ strings in parallel: a faulted string can be back-fed by the others → per-string fuses
  if (parallel >= 3) issues.push({ level: 'info', key: 'string_fuse_required', params: { parallel } })
  return { designCurrent: iDesign, cable, voltageDropPct: vd, issues }
}

/** SPD recommendation: DC Uc must exceed the max string voltage with margin */
export function spd({ vocColdMax, phase }) {
  const ucOptions = [600, 1000, 1200, 1500]
  const need = vocColdMax * 1.2
  return {
    dc: { type: 'Type 2', ucV: ucOptions.find((u) => u >= need) ?? null, need },
    ac: { type: 'Type 2', ucV: 275, poles: phase === 3 ? '3P+N' : '1P+N' },
  }
}
