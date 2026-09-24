import { useCallback, useEffect, useReducer } from 'react'

/**
 * Solar Builder step machine. The whole state lives in the URL query so a refresh,
 * the back button or a shared link lands on the same step with the same inputs.
 */
export const STEPS = ['locate', 'orient', 'preview', 'login', 'role', 'build', 'simulate', 'summary']

// state key → URL param + parser
const FIELDS = {
  step: ['s', (v) => (STEPS.includes(v) ? v : 'locate')],
  lat: ['lat', num],
  lng: ['lng', num],
  azimuth: ['az', (v) => clampNum(v, 0, 359, 180)],
  tilt: ['tilt', (v) => clampNum(v, 0, 60, 10)],
  roof: ['roof', (v) => (['flat', 'gable', 'hip'].includes(v) ? v : 'flat')],
  role: ['role', (v) => (v === 'learner' || v === 'tech' ? v : null)],
  bill: ['bill', (v) => clampNum(v, 300, 100000, 4000)],
  dayShare: ['day', (v) => clampNum(v, 0.2, 0.95, 0.6)],
  phase: ['ph', (v) => (v === '3' ? 3 : 1)],
  backup: ['bk', (v) => (['none', 'part', 'whole'].includes(v) ? v : 'part')],
  signedIn: ['in', (v) => v === '1'],
}
function num(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : null
}
function clampNum(v, lo, hi, dflt) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt
}

function fromUrl() {
  const q = new URLSearchParams(window.location.search)
  return Object.fromEntries(Object.entries(FIELDS).map(([k, [p, parse]]) => [k, parse(q.get(p))]))
}

function toQuery(state) {
  const q = new URLSearchParams(window.location.search) // keep unrelated params (e.g. ?draft)
  for (const [k, [p]] of Object.entries(FIELDS)) {
    const v = state[k]
    if (v == null || v === false) q.delete(p)
    else q.set(p, v === true ? '1' : typeof v === 'number' ? String(Math.round(v * 1e5) / 1e5) : String(v))
  }
  return q.toString()
}

/** is the user allowed to leave `step` going forward? */
export function canAdvance(state, step = state.step) {
  if (step === 'locate') return state.lat != null && state.lng != null
  if (step === 'login') return state.signedIn
  if (step === 'role') return !!state.role
  return true
}

function reducer(state, action) {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.patch }
    case 'go': {
      const target = STEPS.indexOf(action.step)
      // forward jumps only through steps that are satisfied
      for (let i = STEPS.indexOf(state.step); i < target; i++) if (!canAdvance(state, STEPS[i])) return { ...state, step: STEPS[i] }
      return { ...state, step: action.step }
    }
    default:
      return state
  }
}

export default function useSolarFlow() {
  const [state, dispatch] = useReducer(reducer, null, fromUrl)

  useEffect(() => {
    const qs = toQuery(state)
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, '', url)
  }, [state])

  const set = useCallback((patch) => dispatch({ type: 'set', patch }), [])
  const go = useCallback((step) => {
    dispatch({ type: 'go', step })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  const i = STEPS.indexOf(state.step)
  const next = useCallback(() => i < STEPS.length - 1 && go(STEPS[i + 1]), [i, go])
  const back = useCallback(() => i > 0 && go(STEPS[i - 1]), [i, go])

  return { state, set, go, next, back, index: i }
}
