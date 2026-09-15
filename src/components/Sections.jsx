import { useApp } from '../AppContext'
import { services, serviceById } from '../data/services'
import { projects } from '../data/projects'
import { useLang } from '../i18n/LangContext'
import { icons, LogoMark } from './Icons'
import { useTheme } from '../ThemeContext'

/**
 * Placeholder sections below the hero (plan §26). Content is temporary —
 * the structure is what matters: real HTML for SEO and future expansion.
 */
/** Section 03 pillars — icon + accent per item (text lives in strings.js). */
const PILLARS = [
  { icon: 'shield', accent: '#35d6ff', accentLight: '#0a8fc4' },
  { icon: 'layers', accent: '#a78bfa', accentLight: '#7250ea' },
  { icon: 'target', accent: '#7cf5c2', accentLight: '#149c66' },
]

export default function Sections() {
  const { ui, t } = useLang()
  const { projectFilter, setProjectFilter } = useApp()
  const { accent } = useTheme()
  const s = ui.sections

  // Service card → projects section, pre-filtered to that service.
  const seeProjects = (id) => {
    setProjectFilter(id)
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
  }

  const visibleProjects = projectFilter === 'all' ? projects : projects.filter((p) => p.service === projectFilter)

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
            <article key={sv.id} className="tile tile--service liquid" style={{ '--accent': accent(sv) }}>
              <div className={`tile__media${sv.image ? ' has-image' : ''}`} aria-hidden="true">
                {sv.image && <img src={sv.image} alt="" loading="lazy" />}
                <span className="tile__watermark">{icons[sv.icon]}</span>
                <span className="tile__num">{sv.number}</span>
                <span className="card__icon">{icons[sv.icon]}</span>
              </div>
              <div className="tile__body">
                <h3>{t(sv.title)}</h3>
                <p>{t(sv.outcome)}</p>
                <ul className="chips" aria-label={t(sv.title)}>
                  {sv.tags.map((tag) => (
                    <li key={tag} className="chip">{tag}</li>
                  ))}
                </ul>
                <button className="tile__link" onClick={() => seeProjects(sv.id)}>
                  {ui.cta.seeProjects} <span className="arrow">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="section">
        <div className="section__head">
          <span className="kicker">{s.why.kicker}</span>
          <h2>{s.why.title}</h2>
        </div>
        <div className="pillars">
          {s.why.items.map((it, i) => {
            const pv = PILLARS[i]
            return (
              <article key={i} className="pillar liquid" style={{ '--accent': accent(pv) }}>
                <span className="pillar__ghost" aria-hidden="true">0{i + 1}</span>
                <span className="pillar__icon">{icons[pv.icon]}</span>
                <h3>{it.title}</h3>
                <p>{it.body}</p>
                <span className="pillar__line" aria-hidden="true" />
              </article>
            )
          })}
        </div>
      </section>

      <section id="projects" className="section">
        <div className="section__head">
          <span className="kicker">{s.projects.kicker}</span>
          <h2>{s.projects.title}</h2>
          <p>{s.projects.body}</p>
        </div>
        <div className="filter" role="tablist" aria-label={s.projects.title}>
          <button
            role="tab"
            aria-selected={projectFilter === 'all'}
            className={`chip chip--btn${projectFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setProjectFilter('all')}
          >
            {s.projects.all}
          </button>
          {services.map((sv) => (
            <button
              key={sv.id}
              role="tab"
              aria-selected={projectFilter === sv.id}
              className={`chip chip--btn${projectFilter === sv.id ? ' is-active' : ''}`}
              style={{ '--accent': accent(sv) }}
              onClick={() => setProjectFilter(sv.id)}
            >
              {t(sv.title)}
            </button>
          ))}
        </div>
        <div className="grid-3" key={projectFilter}>
          {visibleProjects.map((p) => {
            const sv = serviceById[p.service]
            return (
              <article key={p.id} className="tile tile--project liquid" style={{ '--accent': accent(sv) }}>
                <span className="tile__tag">{t(sv.title)}</span>
                <h3>{t(p.title)}</h3>
                <p>{t(p.meta)}</p>
              </article>
            )
          })}
          {visibleProjects.length === 0 && <p className="filter__empty">{s.projects.empty}</p>}
        </div>
      </section>

      <section id="contact" className="section">
        <div className="cta-band liquid">
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
          <span className="logo__text">
            <b>BE CONNECTED</b>
            <small>Network &amp; Solution Co.,Ltd.</small>
          </span>
        </div>
        <span>{ui.footer.tagline}</span>
        <span>
          © {new Date().getFullYear()} Be Connected Network &amp; Solution Co.,Ltd. · {ui.footer.rights}
        </span>
      </footer>
    </>
  )
}
