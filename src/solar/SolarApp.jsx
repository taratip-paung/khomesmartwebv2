import { useEffect, useMemo, useState } from 'react'
import { ThemeProvider } from '../ThemeContext'
import { LangProvider, useLang } from '../i18n/LangContext'
import { AppProvider } from '../AppContext'
import { LangToggle, ThemeToggle } from '../components/Header'
import { LogoMark } from '../components/Icons'
import useSolarFlow, { STEPS, canAdvance } from './useSolarFlow'
import SolarBee, { SolarBeeProvider, useSolarBee } from './SolarBee'
import OrientView from './OrientView'
import SolarMap from './SolarMap'
import { GMAPS_KEY } from './gmaps'
import useInsights from './useInsights'
import { satOrientation, pickFace, usePreviewNumbers } from './Steps'
import LimitModal from './LimitModal'
import Stage3D from './Stage3D'
import { supportsWebGL } from '../three/Fallback'
import { houseSize } from '../lib/solar/geo'
import { selectedSegment } from '../lib/solar/insights'
import { compass8 } from '../lib/solar/production'
import useBeeEvents from './useBeeEvents'
import useClimate, { ClimateContext } from './useClimate'
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

const MAP_STEPS = ['locate', 'orient', 'preview']

/**
 * Left stage (owner layout, 2026-09-25):
 *   1 locate  → satellite map (search + pin)
 *   2 orient  → satellite map only, with the top-down house footprint turned to the chosen facing (S3.1b)
 *   3 preview → 3D house + animated day + production chart + seasons; the SAME map instance shrinks into a
 *               small inset (top-right) showing the facing set in step 2 — tap it to go back and change it.
 * The map is never unmounted between steps 1–3 (each new google.maps.Map = one billable map load).
 * No Maps key / load failure → step 2 falls back to the interactive 3D view; no WebGL → the SVG compass.
 */
function Stage({ flow, S, ins, lang }) {
  const { state, set, go } = flow
  const [mapFailed, setMapFailed] = useState(false)
  const webgl = useMemo(() => supportsWebGL(), [])
  const hasMap = Boolean(GMAPS_KEY) && !mapFailed
  const mapStep = hasMap && MAP_STEPS.includes(state.step)
  const show3d = webgl && (state.step === 'preview' || (state.step === 'orient' && !hasMap))
  const mapMode = state.step === 'preview' && show3d ? 'inset' : 'full'
  const face = ins.status === 'found' ? selectedSegment(ins.data, state.seg) : null
  const size = useMemo(() => houseSize({ roof: state.roof, pitch: face?.pitch, areaM2: face?.areaM2 }), [state.roof, face?.pitch, face?.areaM2])
  const { kwp, annualPerKwp } = usePreviewNumbers(state, ins)
  const facing = `${S.compass[compass8(state.azimuth)]} ${state.azimuth}°`
  const compass = (
    <OrientView lat={state.lat ?? 18.79} azimuth={state.azimuth} roof={state.roof} onAzimuth={(azimuth) => set({ azimuth })} labels={{ aria: S.stagePlaceholder }} />
  )
  return (
    <div className={`sb-stage${mapStep || show3d ? ' has-map' : ''}${show3d ? ' has-3d' : ''}`}>
      <div className="sb-stage__view">
        {mapStep && (
          <SolarMap
            lat={state.lat}
            lng={state.lng}
            azimuth={state.step === 'locate' ? null : state.azimuth}
            roof={state.roof}
            insights={ins.status === 'found' ? ins.data : null}
            seg={state.seg}
            onSegment={state.step === 'locate' || state.step === 'orient' ? pickFace(ins, set) : undefined}
            onPick={(lat, lng) => set({ lat, lng })}
            onError={() => setMapFailed(true)}
            lang={lang}
            S={S}
            showSearch={state.step === 'locate'}
            mode={mapMode}
            insetLabel={`${S.stage3d.insetLabel}: ${facing}`}
            insetEdit={S.stage3d.insetEdit}
            onInsetClick={() => go('orient')}
          />
        )}
        {show3d && !mapStep && state.step === 'preview' && (
          <div className="sb-stage__mini">
            <OrientView lat={state.lat ?? 18.79} azimuth={state.azimuth} roof={state.roof} labels={{ aria: facing }} />
            <div className="sb-map__inset-label">
              <span>{`${S.stage3d.insetLabel}: ${facing}`}</span>
              <button type="button" className="btn btn--glass btn--sm" onClick={() => go('orient')}>
                {S.stage3d.insetEdit}
              </button>
            </div>
          </div>
        )}
        {show3d && <Stage3D state={state} set={set} size={size} S={S} interactive={state.step === 'orient'} kwp={kwp} annualKwhPerKwp={annualPerKwp} />}
      </div>
      {!mapStep && !show3d && compass}
      {!mapStep && !show3d && <p className="sb-stage__cap">{S.stagePlaceholder}</p>}
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
  const ins = useInsights(state.lat, state.lng)
  const clim = useClimate(state.lat, state.lng) // NASA POWER + PVGIS for this area (server cache) — Chiang Mai table meanwhile

  // satellite orientation → applied once per location (the user can still turn the house afterwards)
  useEffect(() => {
    if (ins.status !== 'found' || state.autoFor === ins.forKey) return
    const sat = satOrientation(ins, null) // new location → start from the sunniest face
    flow.set(sat ? { ...sat, autoFor: ins.forKey, pn: null } : { autoFor: ins.forKey, pn: null })
  }, [ins, state.autoFor]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.dataset.ready = 'true' // header/bee fade-in keys off this (see global.css)
    document.title = `${S.title} — Be Connected`
  }, [S.title])

  useEffect(() => setLines(beeLines(lang, state.step, state.role)), [lang, state.step, state.role, setLines])
  useBeeEvents(state, ins, lang) // น้องบี reacts to roof type / facing / satellite result (S3.6)

  return (
    <>
      <SolarHeader S={S} />
      <ClimateContext.Provider value={clim.climate}>
      <main className="sb">
        <div className="sb__top">
          <p className="kicker">{S.tagline}</p>
          <Stepper flow={flow} S={S} />
        </div>
        <div className="sb__body">
          <Stage flow={flow} S={S} ins={ins} lang={lang} />
          <SolarBee placement="inline" />
          <section className="sb-panel liquid" aria-live="polite">
            <View state={state} set={flow.set} next={next} S={S} ins={ins} />
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
      </ClimateContext.Provider>
      <SolarBee />
      <LimitModal ins={ins} S={S} lang={lang} />
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
