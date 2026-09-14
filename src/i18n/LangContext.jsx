import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { strings } from './strings'

const LangContext = createContext(null)
const STORAGE_KEY = 'khome.lang'

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'th' || saved === 'en') return saved
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('th') ? 'th' : 'en'
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const toggle = useCallback(() => setLang((l) => (l === 'th' ? 'en' : 'th')), [])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggle,
      ui: strings[lang],
      /** pick a bilingual value: t({th, en}) → string */
      t: (v) => (v && typeof v === 'object' ? v[lang] ?? v.en : v),
    }),
    [lang, toggle],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}
