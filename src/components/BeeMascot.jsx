import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { useApp } from '../AppContext'

// three.js is code-split with the main scene; the bee rides the same chunk
const BeeStage = lazy(() => import('../three/BeeStage'))

const LINE_MS = 6000

/**
 * น้องบี in the hero: small transparent 3D stage + speech bubble that walks
 * through the site. Click the bubble (or the bee) for the next line.
 */
export default function BeeMascot() {
  const { ui, lang } = useLang()
  const { isMobile, reducedMotion } = useApp()
  const bee = ui.bee
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(true)
  const excite = useRef(0)
  const timer = useRef()

  const next = useCallback(() => {
    setVisible(false)
    window.setTimeout(() => {
      setI((n) => (n + 1) % bee.lines.length)
      setVisible(true)
      excite.current = 1
    }, 220)
  }, [bee.lines.length])

  // auto-advance; restart the clock on manual advance / language change
  useEffect(() => {
    if (reducedMotion) return undefined
    timer.current = window.setInterval(next, LINE_MS)
    return () => window.clearInterval(timer.current)
  }, [next, reducedMotion, i, lang])

  if (isMobile) return null

  return (
    <div className="bee" onClick={next} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && next()} aria-label={bee.name}>
      <div className="bee__stage" aria-hidden="true">
        <Suspense fallback={null}>
          <BeeStage excite={excite} />
        </Suspense>
      </div>
      <div className={`bee__bubble liquid${visible ? ' is-in' : ''}`}>
        <i className="bee__tail" aria-hidden="true" />
        <span className="bee__name">{bee.name}</span>
        <p key={`${lang}-${i}`}>{bee.lines[i]}</p>
        <span className="bee__dots" aria-hidden="true">
          {bee.lines.map((_, k) => (
            <i key={k} className={k === i ? 'on' : ''} />
          ))}
        </span>
      </div>
    </div>
  )
}
