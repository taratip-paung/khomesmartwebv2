import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../AppContext'
import { useLang } from '../i18n/LangContext'

const BeeStage = lazy(() => import('../three/BeeStage'))

const LINE_MS = 7000
const DOCK = { x: 20, y: 18 }
const SIZE = { h: 200 }

const BeeCtx = createContext(null)

/**
 * น้องบีบน /solar — event-driven.
 * - `setLines(lines)`  : the step's rotating script (from beeScript.js)
 * - `say(text)`        : interrupt with one line now (issue explanations, auto-adds…) then resume the script
 */
export function SolarBeeProvider({ children }) {
  const [lines, setLinesState] = useState([])
  const [override, setOverride] = useState(null)
  const setLines = useCallback((l) => {
    setLinesState(l)
    setOverride(null)
  }, [])
  const say = useCallback((text) => setOverride({ text, at: Date.now() }), [])
  const value = useMemo(() => ({ lines, override, setLines, say }), [lines, override, setLines, say])
  return <BeeCtx.Provider value={value}>{children}</BeeCtx.Provider>
}

export const useSolarBee = () => useContext(BeeCtx)

export default function SolarBee({ placement = 'dock' }) {
  const { lines, override } = useSolarBee()
  const { lang } = useLang()
  const { isMobile, reducedMotion } = useApp()
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(true)
  const excite = useRef(0)
  const el = useRef()

  const text = override?.text ?? lines[i % Math.max(1, lines.length)] ?? ''

  const flip = useCallback((fn) => {
    setVisible(false)
    window.setTimeout(() => {
      fn()
      setVisible(true)
      excite.current = 1
    }, 180)
  }, [])

  // new script → start from its first line
  useEffect(() => flip(() => setI(0)), [lines, flip])
  // an interrupting line → pop the bubble
  useEffect(() => {
    if (override) flip(() => {})
  }, [override, flip])

  // rotate the script (paused while an override is showing — it stays until the next event/step)
  useEffect(() => {
    if (reducedMotion || override || lines.length < 2) return undefined
    const id = window.setInterval(() => flip(() => setI((n) => n + 1)), LINE_MS)
    return () => window.clearInterval(id)
  }, [lines, override, reducedMotion, flip, lang])

  // dock bottom-left of the viewport
  useEffect(() => {
    if (isMobile) return undefined
    const place = () => {
      if (el.current) el.current.style.transform = `translate3d(${DOCK.x}px, ${window.innerHeight - SIZE.h - DOCK.y}px, 0)`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [isMobile])

  const nextLine = () => flip(() => setI((n) => n + 1))

  // mobile renders inline (placement 'inline', inside the page flow); desktop docks bottom-left
  if (isMobile !== (placement === 'inline')) return null

  if (isMobile) {
    return (
      <div className="sbee-strip liquid" role="status" aria-live="polite" onClick={nextLine}>
        <span className="sbee-strip__name">🐝</span>
        <p className={visible ? 'is-in' : ''}>{text}</p>
      </div>
    )
  }

  return (
    <div ref={el} className="bee is-docked sbee" onClick={nextLine} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && nextLine()} aria-label="Bee">
      <div className="bee__inner">
        <div className="bee__stage" aria-hidden="true">
          <Suspense fallback={null}>
            <BeeStage excite={excite} />
          </Suspense>
        </div>
        <div className={`bee__say${visible && text ? ' is-in' : ''}`} role="status" aria-live="polite">
          <svg className="bee__tail" viewBox="0 0 28 26" aria-hidden="true">
            <path d="M22 2 C20 12 12 20 1 25 C10 20 14 16 15 6 Z" />
          </svg>
          <p key={text}>{text}</p>
        </div>
      </div>
    </div>
  )
}
