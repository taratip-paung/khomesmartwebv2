import { useEffect, useState } from 'react'
import { useApp } from '../AppContext'
import { services, serviceById } from '../data/services'
import { projects } from '../data/projects'
import { company } from '../data/company'
import ContactForm from './ContactForm'
import { useLang } from '../i18n/LangContext'
import { icons, LogoMark } from './Icons'
import { useTheme } from '../ThemeContext'

/**
 * Placeholder sections below the hero (plan §26). Content is temporary —
 * the structure is what matters: real HTML for SEO and future expansion.
 */
/** Section 03 pillars — icon + accent + photo per item (text lives in strings.js).
 *  Photos: Unsplash (free licence, commercial use OK) cropped to 900×370 in public/why/. */
const PILLARS = [
  { icon: 'shield', accent: '#35d6ff', accentLight: '#0a8fc4', photo: '/why/safety.webp' },
  { icon: 'layers', accent: '#a78bfa', accentLight: '#7250ea', photo: '/why/stack.webp' },
  { icon: 'target', accent: '#7cf5c2', accentLight: '#149c66', photo: '/why/fit.webp' },
]

/** Overlapping thumbnails of this service's projects — exactly 3, centred in the card; hover fans them out symmetrically. */
function ProjectStack({ serviceId, onClick, label }) {
  const { t } = useLang()
  const list = projects.filter((p) => p.service === serviceId && p.image)
  if (list.length === 0) return null
  const shown = list.slice(0, 3)
  return (
    <button type="button" className="pstack" onClick={onClick} aria-label={`${label}: ${list.length}`} title={label}>
      {shown.map((p, i) => (
        <span key={p.id} className={`pstack__item${p.kind === 'software' ? ' pstack__item--app' : ''}`} style={{ '--i': i }}>
          <img src={p.imageSm || p.image} alt="" loading="lazy" decoding="async" />
        </span>
      ))}
    </button>
  )
}

export default function Sections() {
  const { ui, t, lang } = useLang()
  const { projectFilter, setProjectFilter } = useApp()
  const { accent } = useTheme()
  const s = ui.sections

  // Service card → projects section, pre-filtered to that service.
  const seeProjects = (id) => {
    setProjectFilter(id)
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
  }

  const visibleProjects = projectFilter === 'all' ? projects : projects.filter((p) => p.service === projectFilter)

  // Section 04 lightbox — photo only, Esc / backdrop closes.
  const [lightbox, setLightbox] = useState(null)
  useEffect(() => {
    if (!lightbox) return undefined
    const onKey = (e) => e.key === 'Escape' && setLightbox(null)
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightbox])

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
                <ProjectStack serviceId={sv.id} onClick={() => seeProjects(sv.id)} label={ui.cta.seeProjects} />
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
                {pv.photo && (
                  <span className="pillar__photo" aria-hidden="true">
                    <img src={pv.photo} alt="" loading="lazy" decoding="async" />
                  </span>
                )}
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
        <div className="gallery" key={projectFilter}>
          {visibleProjects.map((p, i) => {
            const sv = serviceById[p.service]
            return (
              <button
                key={p.id}
                type="button"
                className={`shot${p.kind === 'software' ? ' shot--app' : ''}`}
                style={{ '--accent': accent(sv), '--i': i }}
                onClick={() => setLightbox(p)}
                aria-label={`${t(p.title)} — ${t(p.meta)}`}
              >
                {p.kind === 'software' && (
                  <span className="shot__bar" aria-hidden="true">
                    <i /><i /><i />
                    <em>{t(p.title)}</em>
                  </span>
                )}
                <img
                  src={p.imageSm || p.image}
                  srcSet={p.imageSm ? `${p.imageSm} 700w, ${p.image} 1080w` : undefined}
                  sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span className="shot__tag">{t(sv.title)}</span>
                <span className="shot__cap">
                  <b>{t(p.title)}</b>
                  <small>{t(p.meta)}</small>
                </span>
              </button>
            )
          })}
          {visibleProjects.length === 0 && <p className="filter__empty">{s.projects.empty}</p>}
        </div>
      </section>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={t(lightbox.title)} onClick={() => setLightbox(null)}>
          <figure className={lightbox.kind === 'software' ? 'is-app' : undefined} onClick={(e) => e.stopPropagation()}>
            {lightbox.kind === 'software' && (
              <span className="shot__bar" aria-hidden="true">
                <i /><i /><i />
                <em>{t(lightbox.title)}</em>
              </span>
            )}
            <img src={lightbox.image} alt={t(lightbox.title)} />
            <figcaption>
              <b>{t(lightbox.title)}</b>
              <span>{t(lightbox.meta)}</span>
            </figcaption>
          </figure>
          <button type="button" className="lightbox__close" onClick={() => setLightbox(null)} aria-label="Close">
            ×
          </button>
        </div>
      )}

      <section id="contact" className="section">
        <div className="contact">
          <div className="contact__intro">
            <span className="kicker">{s.contact.kicker}</span>
            <h2>{s.contact.title}</h2>
            <p>{s.contact.body}</p>
            <div className="contact__alt">
              <span>{s.contact.channelsLabel}</span>
              <ul className="channels">
                <li>
                  <span className="channels__icon">{icons.mail}</span>
                  <span className="channels__body">
                    <small>{s.contact.channels.email}</small>
                    <a href={`mailto:${company.email}`}>{company.email}</a>
                  </span>
                </li>
                <li>
                  <span className="channels__icon">{icons.line}</span>
                  <span className="channels__body">
                    <small>{s.contact.channels.line}</small>
                    <a href={company.line} target="_blank" rel="noopener noreferrer">{company.lineLabel}</a>
                  </span>
                </li>
                <li>
                  <span className="channels__icon">{icons.facebook}</span>
                  <span className="channels__body">
                    <small>{s.contact.channels.facebook}</small>
                    <a href={company.facebook} target="_blank" rel="noopener noreferrer">{company.facebookLabel}</a>
                  </span>
                </li>
                <li>
                  <span className="channels__icon">{icons.pin}</span>
                  <span className="channels__body">
                    <small>{s.contact.channels.address}</small>
                    <address>{company.address[lang] || company.address.en}</address>
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <ContactForm />
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
