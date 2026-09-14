import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Theme = 'light' | 'dark'.
 * Follows the OS (prefers-color-scheme). The header toggle overrides it (saved in
 * localStorage) until the OS appearance changes again — then the OS wins.
 * index.html applies the same rule before first paint to avoid a flash.
 */
const ThemeContext = createContext(null)
const STORAGE_KEY = 'khome.theme'

const systemTheme = () => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

function initial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return { theme: saved, explicit: true }
  } catch {
    /* ignore */
  }
  return { theme: systemTheme(), explicit: false }
}

export function ThemeProvider({ children }) {
  const [{ theme, explicit }, setState] = useState(initial)

  // an OS appearance change always wins (like most sites): it clears any manual choice
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
      setState({ theme: e.matches ? 'dark' : 'light', explicit: false })
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#060b1a' : '#eef3fa')
  }, [theme])

  const setTheme = useCallback((t) => {
    setState({ theme: t, explicit: true })
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* ignore */
    }
  }, [])
  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggle,
      /** UI accent colour of a service for the current theme */
      accent: (service) => (theme === 'dark' ? service.accent : service.accentLight ?? service.accent),
    }),
    [theme, setTheme, toggle],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
