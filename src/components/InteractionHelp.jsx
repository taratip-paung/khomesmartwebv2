import { useEffect, useRef, useState } from 'react'
import { useApp } from '../AppContext'
import { useLang } from '../i18n/LangContext'
import { icons } from './Icons'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export default function InteractionHelp() {
  const { ui } = useLang()
  const { resetCamera, isMobile } = useApp()
  const h = ui.help
  return (
    <div className="help liquid">
      <span className="help__k desktop-only">{h.title}</span>
      <span className="sep desktop-only" />
      <span>{isMobile ? h.touchDrag : h.drag}</span>
      <span className="sep" />
      <span>{isMobile ? h.pinch : isMac ? h.wheelMac : h.wheel}</span>
      {!isMobile && (
        <>
          <span className="sep" />
          <span>{h.rightClick}</span>
        </>
      )}
      <span className="sep" />
      <button onClick={resetCamera} aria-label={h.reset}>
        <span className="icon" style={{ width: 14, height: 14, display: 'inline-flex' }}>
          {icons.reset}
        </span>
        {h.reset}
      </button>
    </div>
  )
}

export function ScrollCue() {
  const { ui } = useLang()
  return (
    <a className="scroll-cue" href="#services" aria-label={ui.help.scroll}>
      <span className="scroll-cue__ring liquid">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 5l6 5 6-5" />
          <path d="M6 10l6 5 6-5" />
          <path d="M6 15l6 5 6-5" />
        </svg>
      </span>
      <span>{ui.help.scroll}</span>
    </a>
  )
}

/**
 * Google-Maps style nudge: a plain wheel over the 3D hero scrolls the page, so tell the visitor how
 * to zoom instead. Shown at most 3 times per page load so it never nags while they scroll away.
 */
export function ZoomHint() {
  const { ui } = useLang()
  const [on, setOn] = useState(false)
  const st = useRef({ n: 0, showing: false, t: 0 })
  useEffect(() => {
    const s = st.current
    const show = () => {
      if (!s.showing) {
        if (s.n >= 3) return
        s.n += 1
        s.showing = true
        setOn(true)
      }
      clearTimeout(s.t)
      s.t = setTimeout(() => {
        s.showing = false
        setOn(false)
      }, 1400)
    }
    window.addEventListener('khome:zoomhint', show)
    return () => {
      window.removeEventListener('khome:zoomhint', show)
      clearTimeout(s.t)
    }
  }, [])
  return (
    <div className={'zoom-hint liquid' + (on ? ' is-on' : '')} aria-hidden="true">
      {isMac ? ui.help.zoomHintMac : ui.help.zoomHint}
    </div>
  )
}
