import { withDefaults, ghiAnnualAvg } from './assumptions.js'

/**
 * Electricity bill → recommended PV size, panel count and battery size.
 * Pure function; every intermediate value is returned so the UI (and น้องบี) can explain it.
 *
 * @param {object} p
 * @param {number} p.billThb        monthly electricity bill (THB)
 * @param {number} [p.dayShare]     share of use during sun hours (0–1)
 * @param {number} [p.panelWp]      panel size in Wp
 * @param {number} [p.yieldKwhPerKwpDay] specific yield override (e.g. from Solar API sunshine hours)
 * @param {object} [p.assumptions]  overrides for DEFAULTS
 */
export function recommendFromBill({ billThb, dayShare, panelWp = 620, yieldKwhPerKwpDay, assumptions } = {}) {
  const a = withDefaults(assumptions)
  const share = dayShare ?? a.dayShare
  const kwhMonth = billThb / a.tariffThbPerKwh
  const kwhDay = kwhMonth / 30
  const dayKwh = kwhDay * share
  const nightKwh = kwhDay - dayKwh
  const specificYield = yieldKwhPerKwpDay ?? ghiAnnualAvg(a) * a.performanceRatio
  const kwpNeeded = dayKwh / specificYield
  return {
    kwhMonth,
    kwhDay,
    dayKwh,
    nightKwh,
    specificYield,
    kwpNeeded,
    ...fromKwp(kwpNeeded, { panelWp, assumptions: a }),
    batteryKwhSuggested: roundUpTo(nightKwh, 5),
  }
}

/** Chosen kWp → panel count + nearest standard inverter size (not below the need) */
export function fromKwp(kwp, { panelWp = 620, assumptions } = {}) {
  const a = withDefaults(assumptions)
  const panels = Math.max(1, Math.ceil((kwp * 1000) / panelWp))
  const kwpActual = (panels * panelWp) / 1000
  const inverterKw = a.standardInverterKw.find((s) => s >= kwp * 0.95) ?? a.standardInverterKw.at(-1)
  return { panels, kwpActual, inverterKw }
}

export const roundUpTo = (v, step) => (v <= 0 ? 0 : Math.ceil(v / step) * step)
