import { useEffect, useState } from 'react'

/**
 * Fetch Google Solar API building insights for a location via OUR server (/api/solar/insights).
 * Nothing is stored (Google policy) — it lives in memory for this page view only.
 * status: idle | loading | found | not_found | limit | unavailable
 */
export default function useInsights(lat, lng) {
  const [st, setSt] = useState({ status: 'idle', data: null, forKey: null })
  const key = lat != null && lng != null ? `${lat.toFixed(5)},${lng.toFixed(5)}` : null

  useEffect(() => {
    if (!key) return undefined
    const ctl = new AbortController()
    const t = window.setTimeout(async () => {
      setSt((s) => ({ ...s, status: 'loading' }))
      try {
        const r = await fetch(`/api/solar/insights?lat=${lat}&lng=${lng}`, { signal: ctl.signal })
        const j = await r.json().catch(() => null)
        if (!j) return setSt({ status: 'unavailable', data: null, forKey: key })
        const status = j.found ? 'found' : j.reason === 'no_coverage' ? 'not_found' : j.reason === 'daily_limit' ? 'limit' : 'unavailable'
        setSt({ status, data: j, forKey: key })
      } catch (e) {
        if (e.name !== 'AbortError') setSt({ status: 'unavailable', data: null, forKey: key })
      }
    }, 450) // debounce while the pin is being dragged
    return () => {
      ctl.abort()
      window.clearTimeout(t)
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return st.forKey === key ? st : { status: key ? 'loading' : 'idle', data: null, forKey: key }
}
