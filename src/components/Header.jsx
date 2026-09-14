import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { LogoMark, icons } from './Icons'
import { useTheme } from '../ThemeContext'

const links = [
  { key: 'home', href: '#home' },
  { key: 'services', href: '#services' },
  { key: 'about', href: '#about' },
  { key: 'projects', href: '#projects' },
  { key: 'contact', href: '#contact' },
]

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button
      className="lang-toggle"
      onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
      aria-label={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
    >
      <span data-active={lang === 'th'}>TH</span>
      <span data-active={lang === 'en'}>EN</span>
    </button>
  )
}

export function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button className="theme-toggle" onClick={toggle} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Light mode' : 'Dark mode'}>
      {isDark ? icons.sun : icons.moon}
    </button>
  )
}

/**
 * Liquid-glass nav: a "lens" pill slides under the hovered / active item.
 * Active item follows the section in view (scroll spy).
 */
function GlassNav() {
  const { ui, lang } = useLang()
  const navRef = useRef()
  const itemRefs = useRef([])
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(null)
  const [pill, setPill] = useState({ x: 0, w: 0, ready: false })
  const lockUntil = useRef(0) // ignore scroll-spy while a click-triggered smooth scroll is in flight

  // scroll spy
  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1))
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        if (performance.now() < lockUntil.current) return
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(ids.indexOf(visible[0].target.id))
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.2, 0.5] },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // move the lens
  const target = hover ?? active
  useLayoutEffect(() => {
    const el = itemRefs.current[target]
    const nav = navRef.current
    if (!el || !nav) return
    const r = el.getBoundingClientRect()
    const n = nav.getBoundingClientRect()
    setPill({ x: r.left - n.left, w: r.width, ready: true })
  }, [target, lang])
  useEffect(() => {
    const onResize = () => setPill((p) => ({ ...p, ready: false }))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <nav ref={navRef} className="nav liquid" aria-label="Main" onMouseLeave={() => setHover(null)}>
      <span className="nav__lens" data-ready={pill.ready} style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} aria-hidden="true" />
      {links.map((l, i) => (
        <a
          key={l.key}
          href={l.href}
          ref={(el) => (itemRefs.current[i] = el)}
          aria-current={i === active ? 'page' : undefined}
          onMouseEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
          onClick={() => {
            setActive(i)
            lockUntil.current = performance.now() + 1200 // smooth-scroll duration
          }}
        >
          {ui.nav[l.key]}
        </a>
      ))}
    </nav>
  )
}

export default function Header() {
  const { ui } = useLang()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className="header">
        <a className="logo" href="#home" aria-label="Be Connected Network & Solution — home">
          <LogoMark />
          <span className="logo__text">
            <b>BE CONNECTED</b>
            <small>Network &amp; Solution Co.,Ltd.</small>
          </span>
        </a>

        <GlassNav />

        <div className="header__right liquid">
          <LangToggle />
          <ThemeToggle />
          <a className="btn btn--primary btn--sm" href="#contact">
            {ui.cta.getInTouch} <span className="arrow">→</span>
          </a>
          <button
            className="burger"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {open && (
        <div id="mobile-drawer" className="drawer" role="dialog" aria-label="Menu">
          <div className="drawer__sheet liquid">
            {links.map((l) => (
              <a key={l.key} href={l.href} onClick={() => setOpen(false)}>
                {ui.nav[l.key]}
              </a>
            ))}
            <a className="btn btn--primary" href="#contact" onClick={() => setOpen(false)}>
              {ui.cta.getInTouch} <span className="arrow">→</span>
            </a>
          </div>
        </div>
      )}
    </>
  )
}
