import { useEffect, useRef, useState } from 'react'
import { useApp } from '../AppContext'
import { services } from '../data/services'
import { useLang } from '../i18n/LangContext'
import { icons } from './Icons'
import { useTheme } from '../ThemeContext'
import { SOLAR_PUBLIC } from '../solar/config'

export function ServiceCard({ service, active, onSelect, compact = false }) {
  const { t, ui } = useLang()
  const { accent } = useTheme()
  return (
    <button
      className="card"
      aria-pressed={active}
      onClick={() => onSelect(service.id)}
      style={{ '--accent': accent(service) }}
    >
      {!compact && <span className="card__ghost" aria-hidden="true">{icons[service.icon]}</span>}
      <span className="card__icon">{icons[service.icon]}</span>
      <span className="card__text">
        <span className="card__num">{service.number}</span>
        <div className="card__title">{t(service.title)}</div>
        {!compact && <div className="card__sub">{t(service.subtitle)}</div>}
      </span>
      {!compact && (
        <span className="card__cta" aria-hidden="true">
          <span className="card__cta-full">{ui.panel.explore}</span>
          <span className="card__cta-short">3D</span>
          <span className="card__cta-arrow">›</span>
        </span>
      )}
    </button>
  )
}

export function ServiceDetail({ service }) {
  const { t, ui } = useLang()
  const { accent } = useTheme()
  const { setProjectFilter } = useApp()
  if (!service) {
    return (
      <div className="detail" key="intro">
        <div className="detail__bar" />
        <h3>{ui.panel.introTitle}</h3>
        <p>{ui.panel.introBody}</p>
      </div>
    )
  }
  // Same destination as the section-02 cards: projects, pre-filtered to this service.
  const seeProjects = () => {
    setProjectFilter(service.id)
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div className="detail" key={service.id} style={{ '--accent': accent(service) }}>
      <span className="detail__ghost" aria-hidden="true">{service.number}</span>
      <div className="detail__bar" />
      <span className="kicker" style={{ color: 'var(--accent)' }}>
        {service.number} — {t(service.subtitle)}
      </span>
      <h3>{t(service.title)}</h3>
      <p>{t(service.description)}</p>
      <ul className="chips chips--sm" aria-hidden="true">
        {service.tags.map((tag) => (
          <li key={tag} className="chip">{tag}</li>
        ))}
      </ul>
      <button type="button" className="tile__link" onClick={seeProjects}>
        {ui.cta.seeProjects} <span className="arrow">→</span>
      </button>
      {service.id === 'solar' && SOLAR_PUBLIC && (
        <a className="tile__link" href="/solar">
          Solar Builder <span className="arrow">→</span>
        </a>
      )}
    </div>
  )
}

/** Desktop right-side glass panel */
export default function ServicePanel() {
  const { ui } = useLang()
  const { selectedId, select, selected } = useApp()
  const panelRef = useRef()
  return (
    <aside className="panel liquid" aria-label={ui.panel.title} ref={panelRef}>
      <div className="panel__title">
        <span className="panel__bar" aria-hidden="true" />
        <h2>{ui.panel.title}</h2>
      </div>
      {services.map((s) => (
        <ServiceCard key={s.id} service={s} active={selectedId === s.id} onSelect={select} />
      ))}
      <ServiceDetail service={selected} />
      <CoachMark panelRef={panelRef} />
    </aside>
  )
}

const COACH_TARGET = 1 // card index the hand taps: 02 IoT & R&D
const COACH_LOOPS = 3 // 5.5 s per loop
const COACH_DELAY = 1200

/**
 * Coach mark (desktop panel only): a hand glides in and taps card 02, a tip says the cards open
 * the service in the 3D model. Plays 3 times (~16.5 s) and replays EVERY time the hero comes back:
 * page load, "Reset view", and scrolling / nav-clicking back up to Home (owner's call 2026-09-24).
 * Stops at once when the visitor points at the panel or picks a service; never starts while a
 * service is selected. Skipped for reduced motion and when the panel is hidden (mobile).
 */
function CoachMark({ panelRef }) {
  const { ui } = useLang()
  const { sceneReady, selectedId, reducedMotion, resetNonce } = useApp()
  const [runId, setRunId] = useState(0) // bump = play again
  const [pos, setPos] = useState(null) // { x, y, w, h } of the target card inside the panel; null = hidden
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId
  const replay = () => setRunId((n) => n + 1)

  // triggers: first paint of the scene, every reset, every return to the hero
  useEffect(() => {
    if (sceneReady) replay()
  }, [sceneReady])
  useEffect(() => {
    if (resetNonce) replay()
  }, [resetNonce])
  useEffect(() => {
    const hero = document.getElementById('home')
    if (!hero || typeof IntersectionObserver === 'undefined') return
    let left = false
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio < 0.15) left = true
        else if (e.intersectionRatio > 0.6 && left) {
          left = false
          replay()
        }
      },
      { threshold: [0, 0.15, 0.6, 1] },
    )
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  // one run
  useEffect(() => {
    if (!runId || reducedMotion) return
    const panel = panelRef.current
    if (!panel || panel.offsetParent === null) return // panel hidden (mobile)
    setPos(null)
    const start = setTimeout(() => {
      const card = panel.querySelectorAll('.card')[COACH_TARGET]
      if (!card || selectedRef.current) return
      setPos({ x: card.offsetLeft, y: card.offsetTop, w: card.offsetWidth, h: card.offsetHeight })
    }, COACH_DELAY)
    const end = setTimeout(() => setPos(null), COACH_DELAY + COACH_LOOPS * 5500)
    const stop = () => setPos(null)
    panel.addEventListener('pointerenter', stop)
    return () => {
      clearTimeout(start)
      clearTimeout(end)
      panel.removeEventListener('pointerenter', stop)
    }
  }, [runId, reducedMotion, panelRef])

  // any selection (card, marker, model click) ends the current run
  useEffect(() => {
    if (selectedId) setPos(null)
  }, [selectedId])

  // press effect on the real target card while the coach runs (restart its animation each run)
  useEffect(() => {
    const card = panelRef.current?.querySelectorAll('.card')[COACH_TARGET]
    if (!card || !pos) return
    card.classList.add('card--coach')
    return () => card.classList.remove('card--coach')
  }, [pos, panelRef])

  if (!pos) return null
  const style = {
    '--cx': `${pos.x + pos.w * 0.62}px`,
    '--cy': `${pos.y + pos.h * 0.55}px`,
    '--tip-y': `${pos.y + pos.h + 12}px`,
  }
  return (
    <div className="coach" key={runId} style={style} aria-hidden="true">
      <div className="coach__ripple" />
      <div className="coach__hand">
        <svg viewBox="0 0 24 24">
          <path d="M9 11.2V5.5a1.5 1.5 0 0 1 3 0V10l.3-.1a1.5 1.5 0 0 1 2.2 1.1l.1.2a1.5 1.5 0 0 1 2.3.9 1.5 1.5 0 0 1 2.1 1.2V17a5 5 0 0 1-5 5h-1.5a5 5 0 0 1-4-2l-3-4a1.4 1.4 0 0 1 2-2L9 15.5z" />
        </svg>
      </div>
      <div className="coach__tip">{ui.panel.coach}</div>
    </div>
  )
}

/** Mobile: horizontal card selector + detail below the 3D canvas */
/** Mobile: the 01–04 chooser overlaid on the bottom of the 3D scene (first screen, no scrolling) */
export function MobileServiceChips() {
  const { selectedId, select } = useApp()
  return (
    <div className="mobile-chips" role="tablist">
      {services.map((s) => (
        <ServiceCard key={s.id} service={s} active={selectedId === s.id} onSelect={select} compact />
      ))}
    </div>
  )
}

/** Mobile: detail card under the scene; scrolls itself into view when a service is picked */
export function MobileServices() {
  const { selected } = useApp()
  const ref = useRef()
  useEffect(() => {
    if (selected && ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selected])
  return (
    <div className="mobile-services" ref={ref}>
      <ServiceDetail service={selected} />
    </div>
  )
}
