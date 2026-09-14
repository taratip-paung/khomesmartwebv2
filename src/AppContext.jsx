import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { serviceById } from './data/services'

const AppContext = createContext(null)

function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false)
  const [matches, setMatches] = useState(get)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    mq.addEventListener('change', onChange)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function AppProvider({ children }) {
  const [selectedId, setSelectedId] = useState(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [resetNonce, setResetNonce] = useState(0)
  const isMobile = useMediaQuery('(max-width: 900px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const select = useCallback((id) => setSelectedId((cur) => (cur === id ? cur : id)), [])
  const clear = useCallback(() => setSelectedId(null), [])
  const resetCamera = useCallback(() => {
    setSelectedId(null)
    setResetNonce((n) => n + 1)
  }, [])

  const value = useMemo(
    () => ({
      selectedId,
      selected: selectedId ? serviceById[selectedId] : null,
      select,
      clear,
      resetCamera,
      resetNonce,
      sceneReady,
      setSceneReady,
      isMobile,
      reducedMotion,
    }),
    [selectedId, select, clear, resetCamera, resetNonce, sceneReady, isMobile, reducedMotion],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
