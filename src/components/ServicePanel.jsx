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
      <span className="card__icon">{icons[service.icon]}</span>
      <span>
        <span className="card__num">[{service.number}]</span>
        <div className="card__title">{t(service.title)}</div>
        {!compact && <div className="card__sub">{t(service.subtitle)}</div>}
      </span>
      {!compact && <span className="arrow" aria-hidden="true" style={{ color: 'var(--ink-3)' }}>›</span>}
    </button>
  )
}

export function ServiceDetail({ service }) {
  const { t, ui } = useLang()
  const { accent } = useTheme()
  if (!service) {
    return (
      <div className="detail" key="intro">
        <div className="detail__bar" />
        <h3>{ui.panel.introTitle}</h3>
        <p>{ui.panel.introBody}</p>
      </div>
    )
  }
  return (
    <div className="detail" key={service.id} style={{ '--accent': accent(service) }}>
      <div className="detail__bar" />
      <span className="kicker" style={{ color: 'var(--accent)' }}>
        {service.number} — {t(service.subtitle)}
      </span>
      <h3>{t(service.title)}</h3>
      <p>{t(service.description)}</p>
      <a className="btn btn--ghost btn--sm" href={service.href}>
        {ui.cta.learnMore} <span className="arrow">→</span>
      </a>
    </div>
  )
}

/** Desktop right-side glass panel */
export default function ServicePanel() {
  const { ui } = useLang()
  const { selectedId, select, selected } = useApp()
  return (
    <aside className="panel glass" aria-label={ui.panel.title}>
      <div className="panel__title">
        <span className="kicker">{ui.panel.title}</span>
        <span className="panel__hint">{ui.panel.hint}</span>
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
