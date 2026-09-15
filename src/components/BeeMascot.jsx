import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { useApp } from '../AppContext'

// three.js is code-split with the main scene; the bee rides the same chunk
const BeeStage = lazy(() => import('../three/BeeStage'))

const LINE_MS = 6000
const SECTIONS = ['home', 'services', 'about', 'projects', 'contact']
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
  const [section, setSection] = useState('home')
  const lines = bee.lines[section] ?? bee.lines.home
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(true)
  const [docked, setDocked] = useState(false)
  const excite = useRef(0)
  const el = useRef()
  const dockedRef = useRef(false)

  const next = useCallback(() => {
    setVisible(false)
    window.setTimeout(() => {
      setI((n) => (n + 1) % lines.length)
      setVisible(true)
      excite.current = 1
    }, 200)
  }, [lines.length])

  // which section is on screen → Bee only talks about that section (same spy rule as the header)
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean)
    if (!els.length) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setSection(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.2, 0.5] },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // section changed → start that section's first line right away
  useEffect(() => {
    setVisible(false)
    const t = window.setTimeout(() => {
      setI(0)
      setVisible(true)
      excite.current = 1
    }, 200)
    return () => window.clearTimeout(t)
  }, [section])

  // auto-advance; the clock restarts on manual advance / language change
  useEffect(() => {
    if (reducedMotion) return undefined
    const id = window.setInterval(next, LINE_MS)
    return () => window.clearInterval(id)
  }, [next, reducedMotion, i, lang, section])

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
        <p key={`${lang}-${section}-${i}`}>{lines[i] ?? lines[0]}</p>
      </div>
    </div>
  )
}
