/**
 * Solar Builder equipment catalog.
 *
 * ⚠ EVERY value below is `status: 'draft'` — typed from memory as a starting point, NOT verified.
 * Before production the owner checks each item against the manufacturer datasheet, fills `source`
 * (datasheet URL), `verifiedBy`, `verifiedAt` and flips `status` to 'verified' (plan task S4.5).
 * Production UI shows only verified items (see `visibleItems`).
 *
 * Units: V, A, W, kWh. tc* = temperature coefficient in %/°C.
 * inverter.mppt = default limits per MPPT; mpptOverrides[i] = per-input differences.
 * inverter.backup: 'builtin' (backup/EPS port in the box) | 'accessory' (needs backupAccessory[phase]) | 'none'
 * inverter.meter: accessory id needed for zero-export / self-consumption, or null when a CT ships in the box.
 */
const DRAFT = { status: 'draft', source: null, verifiedBy: null, verifiedAt: null }

export const panels = [
  { id: 'pv-620-topcon', brand: 'Generic', model: 'TOPCon bifacial 620 W (ตัวอย่าง)', wp: 620, voc: 55.6, vmp: 46.3, isc: 14.06, imp: 13.39, tcVoc: -0.25, tcPmax: -0.29, sizeMm: [2382, 1134], weightKg: 32.5, ...DRAFT },
  { id: 'pv-550-perc', brand: 'Generic', model: 'Mono PERC 550 W (ตัวอย่าง)', wp: 550, voc: 49.9, vmp: 41.96, isc: 14.0, imp: 13.11, tcVoc: -0.27, tcPmax: -0.35, sizeMm: [2279, 1134], weightKg: 28, ...DRAFT },
]

export const inverters = [
  {
    id: 'hw-5ktl-l1', brand: 'huawei', model: 'SUN2000-5KTL-L1', phase: 1, acW: 5000, acMaxA: 23,
    vdcMax: 600, vStart: 120, mpptCount: 2, mppt: { vMin: 90, vMax: 560, iMax: 12.5, iscMax: 18 },
    batteryBus: 'HV', batteryFamilies: ['huawei-luna-s0'], backup: 'accessory', backupAccessory: 'hw-smartguard-s0', meter: 'hw-dtsu-1ph', ...DRAFT,
  },
  {
    id: 'hw-6ktl-l1', brand: 'huawei', model: 'SUN2000-6KTL-L1', phase: 1, acW: 6000, acMaxA: 27.3,
    vdcMax: 600, vStart: 120, mpptCount: 2, mppt: { vMin: 90, vMax: 560, iMax: 12.5, iscMax: 18 },
    batteryBus: 'HV', batteryFamilies: ['huawei-luna-s0'], backup: 'accessory', backupAccessory: 'hw-smartguard-s0', meter: 'hw-dtsu-1ph', ...DRAFT,
  },
  {
    id: 'hw-10ktl-m1', brand: 'huawei', model: 'SUN2000-10KTL-M1', phase: 3, acW: 10000, acMaxA: 16.9,
    vdcMax: 1100, vStart: 200, mpptCount: 2, mppt: { vMin: 140, vMax: 980, iMax: 11, iscMax: 15 },
    batteryBus: 'HV', batteryFamilies: ['huawei-luna-s0'], backup: 'accessory', backupAccessory: 'hw-smartguard-t0', meter: 'hw-dtsu-3ph', ...DRAFT,
  },
  {
    id: 'dy-5k-sg04lp1', brand: 'deye', model: 'SUN-5K-SG04LP1', phase: 1, acW: 5000, acMaxA: 22.7,
    vdcMax: 500, vStart: 125, mpptCount: 2, mppt: { vMin: 150, vMax: 425, iMax: 13, iscMax: 17 },
    batteryBus: 'LV', batteryFamilies: ['deye-lv'], backup: 'builtin', backupMaxW: 5000, meter: null, ...DRAFT,
  },
  {
    id: 'dy-8k-sg01lp1', brand: 'deye', model: 'SUN-8K-SG01LP1', phase: 1, acW: 8000, acMaxA: 34.8,
    vdcMax: 500, vStart: 125, mpptCount: 2, mppt: { vMin: 150, vMax: 425, iMax: 13, iscMax: 17 }, mpptOverrides: { 0: { iMax: 26, iscMax: 34 } },
    batteryBus: 'LV', batteryFamilies: ['deye-lv'], backup: 'builtin', backupMaxW: 8000, meter: null, ...DRAFT,
  },
  {
    id: 'dy-12k-sg04lp3', brand: 'deye', model: 'SUN-12K-SG04LP3', phase: 3, acW: 12000, acMaxA: 18.2,
    vdcMax: 800, vStart: 160, mpptCount: 2, mppt: { vMin: 200, vMax: 650, iMax: 13, iscMax: 17 }, mpptOverrides: { 0: { iMax: 26, iscMax: 34 } },
    batteryBus: 'LV', batteryFamilies: ['deye-lv'], backup: 'builtin', backupMaxW: 12000, meter: null, ...DRAFT,
  },
  {
    id: 'sg-sh5-rs', brand: 'sungrow', model: 'SH5.0RS', phase: 1, acW: 5000, acMaxA: 22.8,
    vdcMax: 600, vStart: 50, mpptCount: 2, mppt: { vMin: 40, vMax: 560, iMax: 16, iscMax: 20 },
    batteryBus: 'HV', batteryFamilies: ['sungrow-sbr'], backup: 'builtin', backupMaxW: 5000, meter: 'sg-meter-1ph', ...DRAFT,
  },
]

export const batteries = [
  { id: 'hw-luna2000-s0', brand: 'huawei', model: 'LUNA2000-5-S0 (โมดูล 5 kWh)', family: 'huawei-luna-s0', bus: 'HV', moduleKwh: 5, minModules: 1, maxModules: 3, dod: 1.0, ...DRAFT },
  { id: 'dy-se-g51pro', brand: 'deye', model: 'SE-G5.1 Pro (5.12 kWh, 48 V)', family: 'deye-lv', bus: 'LV', moduleKwh: 5.12, minModules: 1, maxModules: 6, dod: 0.9, ...DRAFT },
  { id: 'sg-sbr', brand: 'sungrow', model: 'SBR (โมดูล 3.2 kWh)', family: 'sungrow-sbr', bus: 'HV', moduleKwh: 3.2, minModules: 3, maxModules: 8, dod: 1.0, ...DRAFT },
]

export const accessories = [
  { id: 'hw-smartguard-s0', brand: 'huawei', model: 'SmartGuard-63A-S0', kind: 'backup', phase: 1, ...DRAFT },
  { id: 'hw-smartguard-t0', brand: 'huawei', model: 'SmartGuard-63A-T0', kind: 'backup', phase: 3, ...DRAFT },
  { id: 'hw-dtsu-1ph', brand: 'huawei', model: 'Smart Power Sensor 1φ (DDSU666-H)', kind: 'meter', phase: 1, ...DRAFT },
  { id: 'hw-dtsu-3ph', brand: 'huawei', model: 'Smart Power Sensor 3φ (DTSU666-H)', kind: 'meter', phase: 3, ...DRAFT },
  { id: 'sg-meter-1ph', brand: 'sungrow', model: 'Smart Energy Meter 1φ', kind: 'meter', phase: 1, ...DRAFT },
]

export const catalog = { panels, inverters, batteries, accessories }

/** index every item by id */
export const byId = Object.fromEntries(Object.values(catalog).flat().map((x) => [x.id, x]))

/** items the UI may show: production → verified only; dev (import.meta.env.DEV) → drafts too, flagged */
export const visibleItems = (list, { includeDraft = false } = {}) => list.filter((x) => includeDraft || x.status === 'verified')
