/** Battery helpers — usable energy, stack sizing, backup time */

export const usableKwh = (battery, modules = 1) => battery.moduleKwh * modules * (battery.dod ?? 0.9)

/** modules needed to reach targetKwh (nominal), clamped to the stack limits */
export function modulesFor(battery, targetKwh) {
  const n = Math.ceil(targetKwh / battery.moduleKwh)
  return Math.min(battery.maxModules, Math.max(battery.minModules, n))
}

export function checkStack(battery, modules) {
  const issues = []
  if (modules < battery.minModules) issues.push({ level: 'error', key: 'battery_too_few', params: { n: modules, min: battery.minModules } })
  if (modules > battery.maxModules) issues.push({ level: 'error', key: 'battery_too_many', params: { n: modules, max: battery.maxModules } })
  return issues
}

/** hours of backup for a constant load (kW) */
export const backupHours = (battery, modules, loadKw) => (loadKw > 0 ? usableKwh(battery, modules) / loadKw : Infinity)
