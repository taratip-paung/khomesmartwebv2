import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { useApp } from '../AppContext'

// three.js is code-split with the main scene; the bee rides the same chunk
const BeeStage = lazy(() => import('../three/BeeStage'))

const LINE_MS = 6000
const DOCK = { x: 20, y: 18 } // px from the viewport's bottom-left when docked
const SIZE = { w: 210, h: 200 }

/**
 * น้องบี — lives in a fixed layer. While the hero's `#bee-slot` is on screen the
 * bee sits exactly on that slot (under the hero copy); once the visitor scrolls
 * to another section it flies down to the bottom-left corner and stays there.
 * The speech bubble cycles through `ui.bee.lines`; click bee/bubble for the next.
 */
export default function BeeMascot() {
  const { ui, lang } = useLang()
  const { isMobile, reducedMotion } = useApp()
  const bee = ui.bee
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(true)
  const [docked, setDocked] = useState(false)
  const excite = useRef(0)
  const el = useRef()
  const dockedRef = useRef(false)

  const next = useCallback(() => {
    setVisible(false)
    window.setTimeout(() => {
      setI((n) => (n + 1) % bee.lines.length)
      setVisible(true)
      excite.current = 1
    }, 200)
  }, [bee.lines.length])

  // auto-advance; the clock restarts on manual advance / language change
  useEffect(() => {
    if (reducedMotion) return undefined
    const id = window.setInterval(next, LINE_MS)
    return () => window.clearInterval(id)
  }, [next, reducedMotion, i, lang])

  // follow the hero slot, or dock bottom-left when the hero has scrolled away
  useEffect(() => {
    if (isMobile) return undefined
    const slot = document.getElementById('bee-slot')
    const node = el.current
    if (!slot || !node) return undefined
    let flyTimer
    const place = () => {
      const r = slot.getBoundingClientRect()
      const inHero = r.bottom > 120 && r.top < window.innerHeight - 80
      const x = inHero ? r.left : DOCK.x
      const y = inHero ? r.top : window.innerHeight - SIZE.h - DOCK.y
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (inHero === dockedRef.current) {
        // mode changed → animate the flight, then snap-follow again
        dockedRef.current = !inHero
        setDocked(!inHero)
        node.classList.add('is-flying')
        excite.current = 1
        window.clearTimeout(flyTimer)
        flyTimer = window.setTimeout(() => node.classList.remove('is-flying'), 1000)
      }
    }
    place()
    window.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', place)
    const ro = new ResizeObserver(place)
    ro.observe(slot)
    ro.observe(document.body)
    return () => {
      window.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
      ro.disconnect()
      window.clearTimeout(flyTimer)
    }
  }, [isMobile])

  if (isMobile) return null

  return (
    <div
      ref={el}
      className={`bee${docked ? ' is-docked' : ''}`}
      onClick={next}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && next()}
      aria-label={bee.name}
    >
      <div className="bee__stage" aria-hidden="true">
        <Suspense fallback={null}>
          <BeeStage excite={excite} />
        </Suspense>
      </div>
      <div className={`bee__say${visible ? ' is-in' : ''}`}>
        <svg className="bee__tail" viewBox="0 0 28 26" aria-hidden="true">
          <path d="M22 2 C20 12 12 20 1 25 C10 20 14 16 15 6 Z" />
        </svg>
        <p key={`${lang}-${i}`}>{bee.lines[i]}</p>
      </div>
    </div>
  )
}
