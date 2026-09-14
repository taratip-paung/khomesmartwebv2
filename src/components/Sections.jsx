import { useApp } from '../AppContext'
import { services } from '../data/services'
import { useLang } from '../i18n/LangContext'
import { icons, LogoMark } from './Icons'
import { useTheme } from '../ThemeContext'

/**
 * Placeholder sections below the hero (plan §26). Content is temporary —
 * the structure is what matters: real HTML for SEO and future expansion.
 */
export default function Sections() {
  const { ui, t } = useLang()
  const { select } = useApp()
  const { accent } = useTheme()
  const s = ui.sections

  const focusHero = (id) => {
    select(id)
    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <section id="services" className="section">
        <div className="section__head">
          <span className="kicker">{s.services.kicker}</span>
          <h2>{s.services.title}</h2>
          <p>{s.services.body}</p>
        </div>
        <div className="grid-4">
          {services.map((sv) => (
            <article key={sv.id} className="tile glass" style={{ '--accent': accent(sv) }}>
              <span className="card__icon">{icons[sv.icon]}</span>
              <span className="card__num">[{sv.number}]</span>
              <h3>{t(sv.title)}</h3>
              <p>{t(sv.description)}</p>
              <button className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => focusHero(sv.id)}>
                {ui.cta.learnMore} <span className="arrow">→</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="section">
        <div className="section__head">
          <span className="kicker">{s.why.kicker}</span>
          <h2>{s.why.title}</h2>
        </div>
        <div className="grid-3">
          {s.why.items.map((it, i) => (
            <article key={i} className="tile glass">
              <span className="kicker">0{i + 1}</span>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="projects" className="section">
        <div className="section__head">
          <span className="kicker">{s.projects.kicker}</span>
          <h2>{s.projects.title}</h2>
          <p>{s.projects.body}</p>
        </div>
        <div className="grid-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="tile tile--ph glass">
              PROJECT 0{n} — COMING SOON
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="section">
        <div className="cta-band glass glass--strong">
          <span className="kicker">{s.contact.kicker}</span>
          <h2>{s.contact.title}</h2>
          <p>{s.contact.body}</p>
          <a className="btn btn--primary" href={`mailto:${s.contact.email}`}>
            {ui.cta.getInTouch} <span className="arrow">→</span>
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="logo" style={{ color: 'var(--ink-2)' }}>
          <LogoMark />
          <span>KHOME SMART</span>
        </div>
        <span>{ui.footer.tagline}</span>
        <span>
          © {new Date().getFullYear()} KHOME SMART · {ui.footer.rights}
        </span>
      </footer>
    </>
  )
}
