import { withDefaults } from './assumptions.js'
import { checkArray, suggestStrings } from './stringDesign.js'
import { acCircuit, dcCircuit, spd } from './protection.js'
import { checkStack } from './battery.js'

/**
 * Validate a whole system and derive what must be added.
 *
 * system = {
 *   phase: 1|3, backupMode: 'none'|'part'|'whole', backupLoadKw?,
 *   panelId, panels, inverterId, batteryId?, batteryModules?,
 *   strings?: [{ mpptIndex, series, parallel }]   // omitted → auto-suggested
 *   acLengthM?, dcLengthM?
 * }
 * cat = { byId }  (from src/data/solar/catalog.js)
 *
 * Returns { issues[], autoAdds[], strings, array, ac, dc[], spd, ok }
 *   issue    = { level: 'error'|'warning'|'info', key, params }
 *   autoAdd  = { id?|kind, reason: key, locked: bool }
 */
export function validateSystem(system, cat, assumptions) {
  const a = withDefaults(assumptions)
  const issues = []
  const autoAdds = []
  const inv = cat.byId[system.inverterId]
  const panel = cat.byId[system.panelId]
  const bat = system.batteryId ? cat.byId[system.batteryId] : null
  const wantsBackup = system.backupMode && system.backupMode !== 'none'

  if (!inv || !panel) return { issues: [{ level: 'error', key: 'missing_part', params: {} }], autoAdds, ok: false }

  // --- grid phase ------------------------------------------------------------
  if (inv.phase !== system.phase) issues.push({ level: 'error', key: 'phase_mismatch', params: { house: system.phase, inverter: inv.phase } })

  // --- battery compatibility -------------------------------------------------
  if (bat) {
    if (!inv.batteryFamilies?.includes(bat.family))
      issues.push({ level: 'error', key: 'battery_incompatible', params: { bus: inv.batteryBus, batteryBus: bat.bus } })
    issues.push(...checkStack(bat, system.batteryModules ?? bat.minModules))
  }

  // --- backup path -----------------------------------------------------------
  if (wantsBackup) {
    if (inv.backup === 'accessory') {
      autoAdds.push({ id: inv.backupAccessory, kind: 'backup', reason: 'backup_accessory_required', locked: true })
    } else if (inv.backup === 'none') {
      issues.push({ level: 'error', key: 'backup_not_supported', params: {} })
    } else {
      issues.push({ level: 'info', key: 'backup_builtin', params: {} })
    }
    if (!bat) issues.push({ level: 'warning', key: 'backup_no_battery', params: {} })
    const limitW = inv.backupMaxW ?? inv.acW
    if (system.backupMode === 'whole' && system.backupLoadKw && system.backupLoadKw * 1000 > limitW)
      issues.push({ level: 'warning', key: 'backup_overload', params: { load: system.backupLoadKw, limit: limitW / 1000 } })
  } else if (bat && inv.backup === 'accessory') {
    // the classic misunderstanding: battery ≠ power during an outage
    issues.push({ level: 'info', key: 'battery_no_backup', params: {} })
  }

  // --- metering (zero export / self-consumption) -----------------------------
  if (inv.meter) autoAdds.push({ id: inv.meter, kind: 'meter', reason: 'meter_required', locked: true })

  // --- strings ---------------------------------------------------------------
  const strings = system.strings ?? suggestStrings({ panel, inverter: inv, panels: system.panels, assumptions: a })
  let array = null
  const dc = []
  if (!strings) {
    issues.push({ level: 'error', key: 'no_valid_string_layout', params: { panels: system.panels } })
  } else {
    array = checkArray({ panel, inverter: inv, inputs: strings, assumptions: a })
    issues.push(...array.issues)
    array.perMppt.forEach((r, i) => {
      const d = dcCircuit({ iscTotal: r.values.iscTotal, vmpString: r.values.vmpHotString, parallel: strings[i].parallel, lengthM: system.dcLengthM ?? 20, assumptions: a })
      dc.push(d)
      issues.push(...d.issues.map((x) => ({ ...x, params: { ...x.params, mppt: strings[i].mpptIndex + 1 } })))
    })
  }

  // --- AC side + protection (safety kit is always added and locked) -----------
  const ac = acCircuit({ inverter: inv, lengthM: system.acLengthM ?? 10, assumptions: a })
  issues.push(...ac.issues)
  const vocColdMax = array ? Math.max(...array.perMppt.map((r) => r.values.vocColdString)) : inv.vdcMax
  const surge = spd({ vocColdMax, phase: inv.phase })
  autoAdds.push({ kind: 'safety', reason: 'safety_kit', locked: true, detail: { spd: surge, acBreakerA: ac.breaker.rating, acCableMm2: ac.cable?.mm2 } })

  return { issues, autoAdds, strings, array, ac, dc, spd: surge, ok: !issues.some((x) => x.level === 'error') }
}
