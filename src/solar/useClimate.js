import { createContext, useContext, useEffect, useState } from 'react'
import { CLIMATE_CM } from '../data/solar/climateCM'
import { climateCell } from '../lib/solar/climate'

/** climate for the production model — the built-in Chiang Mai table until the server answers for this area */
export const ClimateContext = createContext(CLIMATE_CM)
export const useClimateData = () => useContext(ClimateContext)

const cache = new Map() // cell → climate (per page view)

/**
 * Fetch /api/solar/climate for the 0.25° cell around the pin (NASA POWER + PVGIS, cached on our server).
 * status: builtin (no pin) | loading | live | fallback (server/network unavailable → Chiang Mai table)
 */
export default function useClimate(lat, lng) {
  const cell = lat != null && lng != null ? climateCell(lat, lng).key : null
  const [st, setSt] = useState({ cell: null, climate: CLIMATE_CM, status: 'builtin' })
  useEffect(() => {
    if (!cell) return undefined
    if (cache.has(cell)) {
      setSt({ cell, climate: cache.get(cell), status: 'live' })
      return undefined
    }
    const ctl = new AbortController()
    setSt((s) => ({ ...s, cell, status: 'loading' }))
    fetch(`/api/solar/climate?lat=${lat}&lng=${lng}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok && j.climate?.tl?.length === 12) {
          cache.set(cell, j.climate)
          setSt({ cell, climate: j.climate, status: 'live' })
        } else setSt({ cell, climate: CLIMATE_CM, status: 'fallback' })
      })
      .catch((e) => e.name !== 'AbortError' && setSt({ cell, climate: CLIMATE_CM, status: 'fallback' }))
    return () => ctl.abort()
  }, [cell]) // eslint-disable-line react-hooks/exhaustive-deps
  return st.cell === cell ? st : { cell, climate: cache.get(cell) ?? CLIMATE_CM, status: cell ? 'loading' : 'builtin' }
}
