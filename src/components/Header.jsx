import { useEffect, useState } from 'react'
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
        <a className="logo" href="#home" aria-label="KHOME SMART — home">
          <LogoMark />
          <span>KHOME SMART</span>
        </a>

        <nav className="nav glass" aria-label="Main">
          {links.map((l) => (
            <a key={l.key} href={l.href} aria-current={l.key === 'home' ? 'page' : undefined}>
              {ui.nav[l.key]}
            </a>
          ))}
        </nav>

        <div className="header__right">
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
          {links.map((l) => (
            <a key={l.key} href={l.href} onClick={() => setOpen(false)}>
              {ui.nav[l.key]}
            </a>
          ))}
          <a className="btn btn--primary" href="#contact" onClick={() => setOpen(false)}>
            {ui.cta.getInTouch} <span className="arrow">→</span>
          </a>
        </div>
      )}
    </>
  )
}
