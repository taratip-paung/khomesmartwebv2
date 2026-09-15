import { useApp } from '../AppContext'
import { services } from '../data/services'
import { useLang } from '../i18n/LangContext'
import { icons } from './Icons'
import { useTheme } from '../ThemeContext'

export function ServiceCard({ service, active, onSelect, compact = false }) {
  const { t } = useLang()
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
      {!compact && <span className="card__arrow arrow" aria-hidden="true">›</span>}
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
    </div>
  )
}

/** Desktop right-side glass panel */
export default function ServicePanel() {
  const { ui } = useLang()
  const { selectedId, select, selected } = useApp()
  return (
    <aside className="panel liquid" aria-label={ui.panel.title}>
      <div className="panel__title">
        <span className="panel__bar" aria-hidden="true" />
        <h2>{ui.panel.title}</h2>
      </div>
      {services.map((s) => (
        <ServiceCard key={s.id} service={s} active={selectedId === s.id} onSelect={select} />
      ))}
      <ServiceDetail service={selected} />
    </aside>
  )
}

/** Mobile: horizontal card selector + detail below the 3D canvas */
export function MobileServices() {
  const { selectedId, select, selected } = useApp()
  return (
    <div className="mobile-services">
      <div className="mobile-services__row">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} active={selectedId === s.id} onSelect={select} compact />
        ))}
      </div>
      <ServiceDetail service={selected} />
    </div>
  )
}
