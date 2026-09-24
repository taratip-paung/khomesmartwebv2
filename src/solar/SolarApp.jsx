import { useEffect } from 'react'
import { ThemeProvider } from '../ThemeContext'
import { LangProvider, useLang } from '../i18n/LangContext'
import { AppProvider } from '../AppContext'
import { LangToggle, ThemeToggle } from '../components/Header'
import { LogoMark } from '../components/Icons'
import useSolarFlow, { STEPS, canAdvance } from './useSolarFlow'
import SolarBee, { SolarBeeProvider, useSolarBee } from './SolarBee'
import OrientView from './OrientView'
import { SOLAR_STRINGS } from './i18n'
import { SOLAR_PUBLIC } from './config'
import { beeLines } from '../data/solar/beeScript'
import { LocateStep, OrientStep, PreviewStep, LoginStep, RoleStep, BuildStep, SimulateStep, SummaryStep } from './Steps'
import './solar.css'

const STEP_VIEWS = { locate: LocateStep, orient: OrientStep, preview: PreviewStep, login: LoginStep, role: RoleStep, build: BuildStep, simulate: SimulateStep, summary: SummaryStep }

function SolarHeader({ S }) {
  return (
    <header className="header sb-header">
      <a className="logo" href="/" aria-label="Be Connected — home">
        <LogoMark />
        <span className="logo__text">
          <b>BE CONNECTED</b>
          <small>Network &amp; Solution Co.,Ltd.</small>
        </span>
      </a>
      <div className="sb-header__title">
        <b>{S.title}</b>
        {!SOLAR_PUBLIC && <span className="sb-badge">{S.preview}</span>}
      </div>
      <div className="header__right liquid">
        <LangToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}

function Stepper({ flow, S }) {
  const { state, go, index } = flow
  return (
    <ol className="sb-stepper" aria-label="Steps">
      {STEPS.map((s, i) => {
        const reachable = STEPS.slice(0, i).every((p) => canAdvance(state, p))
        return (
          <li key={s} aria-current={s === state.step ? 'step' : undefined} data-done={i < index}>
            <button type="button" disabled={!reachable} onClick={() => go(s)}>
              <span className="sb-stepper__n">{i + 1}</span>
              <span className="sb-stepper__t">{S.steps[s]}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function Stage({ flow, S }) {
  const { state, set } = flow
  // S3 replaces this with the 3D scene (OrientedHouse + SunPath); the top view already teaches orientation
  return (
    <div className="sb-stage">
      <OrientView lat={state.lat ?? 18.79} azimuth={state.azimuth} roof={state.roof} onAzimuth={(azimuth) => set({ azimuth })} labels={{ aria: S.stagePlaceholder }} />
      <p className="sb-stage__cap">{S.stagePlaceholder}</p>
    </div>
  )
}

function SolarPage() {
  const { lang } = useLang()
  const S = SOLAR_STRINGS[lang]
  const flow = useSolarFlow()
  const { state, next, back, index } = flow
  const { setLines } = useSolarBee()
  const View = STEP_VIEWS[state.step]

  useEffect(() => {
    document.documentElement.dataset.ready = 'true' // header/bee fade-in keys off this (see global.css)
    document.title = `${S.title} — Be Connected`
  }, [S.title])

  useEffect(() => setLines(beeLines(lang, state.step, state.role)), [lang, state.step, state.role, setLines])

  return (
    <>
      <SolarHeader S={S} />
      <main className="sb">
        <div className="sb__top">
          <p className="kicker">{S.tagline}</p>
          <Stepper flow={flow} S={S} />
        </div>
        <div className="sb__body">
          <Stage flow={flow} S={S} />
          <SolarBee placement="inline" />
          <section className="sb-panel liquid" aria-live="polite">
            <View state={state} set={flow.set} next={next} S={S} />
            <div className="sb-nav">
              <button type="button" className="btn btn--ghost btn--sm" onClick={back} disabled={index === 0}>← {S.back}</button>
              {index < STEPS.length - 1 && (
                <button type="button" className="btn btn--primary btn--sm" onClick={next} disabled={!canAdvance(state)}>
                  {S.next} <span className="arrow">→</span>
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
      <SolarBee />
    </>
  )
}

export default function SolarApp() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AppProvider>
          <SolarBeeProvider>
            <SolarPage />
          </SolarBeeProvider>
        </AppProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
