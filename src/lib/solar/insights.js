/**
 * Google Solar API (buildingInsights:findClosest) — request + trimming.
 * Shared by the Vite dev middleware (solar-server/devPlugin.mjs) and the production backend (S2).
 *
 * Google policy: Solar API content must NOT be cached/stored (place IDs excepted) and must be
 * attributed ("Includes solar data from Google"). So: fetch per request, trim, return — nothing persisted.
 */
export const SOLAR_ENDPOINT = 'https://solar.googleapis.com/v1/buildingInsights:findClosest'

/** call the API (server side only — the key never reaches the browser) */
export async function fetchBuildingInsights({ lat, lng, key, fetchImpl = fetch, signal }) {
  const url = `${SOLAR_ENDPOINT}?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=BASE&key=${encodeURIComponent(key)}`
  const res = await fetchImpl(url, { signal })
  if (res.status === 404) return { found: false, reason: 'no_coverage' }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { found: false, reason: 'api_error', status: res.status, message: json?.error?.message }
  return trimInsights(json)
}

const ll = (p) => (p ? { lat: p.latitude, lng: p.longitude } : null)
const dateStr = (d) => (d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : null)
const round = (v, n = 1) => (v == null ? null : Math.round(v * 10 ** n) / 10 ** n)

/** keep only what the UI uses (smaller payload, nothing sensitive) */
export function trimInsights(j) {
  const sp = j.solarPotential ?? {}
  const segments = (sp.roofSegmentStats ?? []).map((s, i) => {
    const q = s.stats?.sunshineQuantiles ?? []
    return {
      i,
      azimuth: round(s.azimuthDegrees ?? 0),
      pitch: round(s.pitchDegrees ?? 0),
      areaM2: round(s.stats?.areaMeters2 ?? 0),
      sunshineMedian: round(q[Math.floor(q.length / 2)] ?? 0, 0),
      sunshineMax: round(q[q.length - 1] ?? 0, 0),
      center: ll(s.center),
      bbox: s.boundingBox ? { sw: ll(s.boundingBox.sw), ne: ll(s.boundingBox.ne) } : null,
    }
  })
  const configs = sp.solarPanelConfigs ?? []
  const best = configs[configs.length - 1]
  const panelW = sp.panelCapacityWatts ?? 400
  return {
    found: true,
    center: ll(j.center),
    imageryQuality: j.imageryQuality ?? null,
    imageryDate: dateStr(j.imageryDate),
    maxPanels: sp.maxArrayPanelsCount ?? 0,
    panelW,
    panelSizeM: [sp.panelHeightMeters ?? 1.879, sp.panelWidthMeters ?? 1.045],
    maxKwp: round(((sp.maxArrayPanelsCount ?? 0) * panelW) / 1000, 2),
    maxAreaM2: round(sp.maxArrayAreaMeters2 ?? 0),
    maxSunshine: round(sp.maxSunshineHoursPerYear ?? 0, 0),
    maxYearlyDcKwh: best ? round(best.yearlyEnergyDcKwh, 0) : null,
    segments,
    // Google's layouts: [panelsCount, yearly DC kWh] — panels are added best-spot-first, so energy grows less than linearly
    configs: thinConfigs(configs),
    // first panels of Google's best layout (for drawing on the map); capped to keep payload small
    panels: (sp.solarPanels ?? []).slice(0, 300).map((p) => ({
      lat: p.center.latitude,
      lng: p.center.longitude,
      o: p.orientation === 'PORTRAIT' ? 'P' : 'L',
      s: p.segmentIndex,
      kwh: round(p.yearlyEnergyDcKwh, 0),
    })),
  }
}

/** keep every layout for small roofs; sample big ones (≤ 80 points is plenty for a chart/slider) */
function thinConfigs(configs) {
  const all = configs.map((c) => [c.panelsCount, round(c.yearlyEnergyDcKwh, 0)])
  if (all.length <= 80) return all
  const step = (all.length - 1) / 79
  return Array.from({ length: 80 }, (_, i) => all[Math.round(i * step)])
}

/**
 * The roof face we suggest first: the SUNNIEST face that is big enough to be useful
 * (≥ 8 m² and ≥ 20 % of the largest face). Area is not multiplied in — a big north face must not win
 * over a smaller south face (bug seen on a real gable roof, 2026-09-24).
 */
export function mainSegment(ins) {
  if (!ins?.found || !ins.segments.length) return null
  const largest = Math.max(...ins.segments.map((s) => s.areaM2))
  const usable = ins.segments.filter((s) => s.areaM2 >= Math.max(8, 0.2 * largest))
  const pool = usable.length ? usable : ins.segments
  return pool.reduce((a, b) => (b.sunshineMedian > a.sunshineMedian ? b : a))
}

/** the face the user picked (index), falling back to the suggested one */
export function selectedSegment(ins, idx) {
  if (!ins?.found) return null
  return (idx != null && ins.segments[idx]) || mainSegment(ins)
}

/** roof type guess from the main segment pitch */
export const roofFromPitch = (pitch) => (pitch < 5 ? 'flat' : 'gable')
