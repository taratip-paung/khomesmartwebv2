import { useLang } from '../i18n/LangContext'

export default function HeroContent() {
  const { ui } = useLang()
  const h = ui.hero
  return (
    <div className="hero-content">
      <span className="kicker">{h.kicker}</span>
      <h1>
        {h.kicker2}
        <span className="brand">{h.brand}</span>
      </h1>
      <p>{h.statement}</p>
      <div className="cats">
        {h.categories.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="ctas">
        <a className="btn btn--primary" href="#services">
          {ui.cta.explore} <span className="arrow">→</span>
        </a>
        <a className="btn btn--ghost" href="#contact">
          {ui.cta.contact}
        </a>
      </div>
    </div>
  )
}
