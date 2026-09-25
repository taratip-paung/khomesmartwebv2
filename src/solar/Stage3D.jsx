import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../AppContext'
import { useTheme } from '../ThemeContext'
import { sunPosition, compass8 } from '../lib/solar/production'
import { dayOfYear, solarFromClock, clockFromSolar, hhmm } from '../lib/solar/geo'
import { SEASONS, SEASON_ORDER, seasonOfDay, seasonYield, dayCurve, pickInverterKw, curveEnergy, curveAt, sunFacts } from '../lib/solar/seasons'
import { useClimateData } from './useClimate'
import ProductionChart from './ProductionChart'

const SolarScene = lazy(() => import('./scene/SolarScene'))
const SPEED_H_PER_S = 1.1 // animation: ~11 s from sunrise to sunset
const SEASON_DAYS = Object.fromEntries(SEASON_ORDER.map((k) => [k, SEASONS[k].day]))

function startHour() {
  const n = new Date()
  const h = n.getHours() + n.getMinutes() / 60
  return h >= 7 && h <= 17.5 ? Math.round(h * 4) / 4 : 10
}
const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d })

/**
 * 3D stage for step 3 (S3.3 + owner feedback 2026-09-25):
 * 3D house with an animated day (sun rises → sets, shadows move), a production chart underneath whose cursor
 * runs in sync with the 3D time, a Thai-season picker (hot / rainy / cool) and per-season energy + sun direction.
 */
export default function Stage3D({ state, set, size, S, interactive, kwp, annualKwhPerKwp }) {
  const climate = useClimateData()
  const { isMobile, reducedMotion } = useApp()
  const { theme } = useTheme()
  const T = S.stage3d
  const lat = state.lat ?? 18.79
  const lng = state.lng ?? 98.98
  const [season, setSeason] = useState(() => seasonOfDay(dayOfYear(new Date())))
  const [clock, setClock] = useState(startHour)
  const [playing, setPlaying] = useState(!reducedMotion)
  const day = SEASONS[season].day

  const invKw = pickInverterKw(kwp)
  const sy = useMemo(
    () => seasonYield({ kwp, tilt: state.tilt, azimuth: state.azimuth, latitude: lat, lng, annualKwhPerKwp, climate }),
    [kwp, state.tilt, state.azimuth, lat, lng, annualKwhPerKwp, climate],
  )
  // one day of power. The average day carries this roof's Google data (`sy.scale`: its yearly sunshine incl. shading);
  // the sunny day stays pure physics — a clear noon on an unshaded panel is what the inverter shows. The inverter clips both.
  const curveFor = useCallback(
    (kind, d) =>
      dayCurve({ kind, latitude: lat, lng, day: d, tilt: state.tilt, azimuth: state.azimuth, kwp, climate }).map((p) => ({
        ...p,
        kw: Math.min(invKw, kind === 'avg' ? p.kw * sy.scale : p.kw),
      })),
    [lat, lng, state.tilt, state.azimuth, kwp, climate, sy.scale, invKw],
  )
  const facts = useMemo(() => Object.fromEntries(SEASON_ORDER.map((k) => [k, sunFacts(lat, SEASONS[k].day)])), [lat])
  const curve = useMemo(() => curveFor('avg', day), [curveFor, day])

  // clear sunny day (what the inverter shows on a good day) vs the season-average day (clouds + rain included)
  const clear = useMemo(() => curveFor('clear', day), [curveFor, day])

  // animation window = sunrise → sunset (clock time) with a little night on both ends
  const win = useMemo(() => {
    const f = facts[season]
    return { from: clockFromSolar(f.rise.h, lng, day) - 0.4, to: clockFromSolar(f.set.h, lng, day) + 0.4 }
  }, [facts, season, lng, day])
  const winRef = useRef(win)
  winRef.current = win

  useEffect(() => {
    if (!playing) return undefined
    let raf
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      setClock((c) => {
        const { from, to } = winRef.current
        const n = c + dt * SPEED_H_PER_S
        return n > to || n < from - 0.5 ? from : n
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const scrub = useCallback((c) => {
    setPlaying(false)
    setClock(c)
  }, [])
  const onAzimuth = useCallback((azimuth) => set({ azimuth }), [set])

  const solarHour = solarFromClock(clock, lng, day)
  const sun = sunPosition(lat, day, solarHour)
  const kwNow = curveAt(clear, solarHour)
  const dir = (az) => S.compass[compass8(az)]
  // per season: clear-day energy (every day sunny) next to the season average (clouds + rain)
  const clearPerDay = useMemo(
    () =>
      Object.fromEntries(
        SEASON_ORDER.map((k) => [k, curveEnergy(curveFor('clear', SEASONS[k].day))]),
      ),
    [curveFor],
  )
  const maxPerDay = Math.max(...SEASON_ORDER.map((k) => clearPerDay[k]))

  return (
    <div className="sb-3d">
      <div className="sb-3d__canvas">
        <Suspense fallback={<div className="sb-3d__loading">{T.loading}</div>}>
          <SolarScene
            lat={lat}
            azimuth={state.azimuth}
            tilt={state.tilt}
            roof={state.roof}
            size={size}
            day={day}
            solarHour={solarHour}
            days={SEASON_DAYS}
            dark={theme === 'dark'}
            isMobile={isMobile}
            onAzimuth={interactive ? onAzimuth : undefined}
          />
        </Suspense>
        <div className="sb-3d__hud" aria-live="off">
          <b>{hhmm(clock)}</b>
          <span>{sun.elevation > 0 ? `${fmt(kwNow, 1)} kW` : T.night}</span>
        </div>
      </div>

      <div className="sb-3d__bar liquid">
        <div className="sb-3d__days" role="radiogroup" aria-label={T.season}>
          {SEASON_ORDER.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={season === k} onClick={() => setSeason(k)}>
              {T.seasons[k]} <small>{T.seasonMonths[k]}</small>
            </button>
          ))}
        </div>
        <div className="sb-3d__time">
          <button type="button" className="sb-3d__play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? T.pause : T.play}>
            {playing ? '❚❚' : '▶'}
          </button>
          <input type="range" min="5.5" max="19.5" step="0.05" value={clock} onChange={(e) => scrub(+e.target.value)} aria-label={T.time} />
        </div>
        <p className="sb-3d__sun">
          {sun.elevation > 0
            ? T.sun.replace('{dir}', dir(sun.azimuth)).replace('{az}', Math.round(sun.azimuth)).replace('{el}', Math.round(sun.elevation))
            : T.night}
        </p>
      </div>

      <ProductionChart
        curve={clear}
        avgCurve={curve}
        toClock={(h) => clockFromSolar(h, lng, day)}
        toSolar={(c) => solarFromClock(c, lng, day)}
        clock={clock}
        onScrub={scrub}
        title={T.chartTitle.replace('{kwp}', fmt(kwp, 2)).replace('{inv}', invKw).replace('{season}', T.seasons[season])}
        total={T.chartTotal.replace('{clear}', fmt(curveEnergy(clear), 1)).replace('{kwh}', fmt(curveEnergy(curve), 1))}
        S={S}
      />

      <section className="sb-seasons" aria-label={T.seasonsH}>
        <h3>{T.seasonsH}</h3>
        <div className="sb-seasons__grid">
          {SEASON_ORDER.map((k) => {
            const s = sy.seasons[k]
            const f = facts[k]
            return (
              <button key={k} type="button" className="sb-season" aria-pressed={season === k} onClick={() => setSeason(k)}>
                <span className="sb-season__name">
                  {T.seasons[k]} <small>{T.seasonMonths[k]}</small>
                </span>
                <span className="sb-season__row">
                  <span>{T.caseClear}</span>
                  <b>
                    {fmt(clearPerDay[k], 1)} <small>{T.perDay}</small>
                  </b>
                </span>
                <span className="sb-season__bar" aria-hidden="true">
                  <i style={{ width: `${(clearPerDay[k] / maxPerDay) * 100}%` }} />
                </span>
                <span className="sb-season__row">
                  <span>{T.caseAvg}</span>
                  <b>
                    {fmt(s.perDay, 1)} <small>{T.perDay}</small>
                  </b>
                </span>
                <span className="sb-season__bar" aria-hidden="true">
                  <i className="is-avg" style={{ width: `${(s.perDay / maxPerDay) * 100}%` }} />
                </span>
                <span className="sb-season__total">
                  {T.seasonTotal
                    .replace('{clear}', fmt(Math.round((clearPerDay[k] * s.days) / 10) * 10))
                    .replace('{kwh}', fmt(Math.round(s.kwh / 10) * 10))
                    .replace('{pct}', fmt(s.share * 100))}
                </span>
                <span className="sb-season__sun">
                  {T.sunTimes.replace('{rise}', hhmm(clockFromSolar(f.rise.h, lng, SEASONS[k].day))).replace('{set}', hhmm(clockFromSolar(f.set.h, lng, SEASONS[k].day)))}
                </span>
                <span className="sb-season__sun">
                  {T.sunRise.replace('{dir}', dir(f.rise.az)).replace('{az}', Math.round(f.rise.az))} ·{' '}
                  {T.sunNoon.replace('{dir}', dir(f.noon.azimuth)).replace('{el}', Math.round(f.noon.elevation))} ·{' '}
                  {T.sunSet.replace('{dir}', dir(f.set.az)).replace('{az}', Math.round(f.set.az))}
                </span>
                <span className="sb-season__sun">{T.dayLen.replace('{h}', fmt(f.dayLength, 1))}</span>
              </button>
            )
          })}
        </div>
        <p className="sb-note">
          {T.seasonsNote.replace('{year}', fmt(Math.round(sy.yearKwh / 10) * 10))} · {T.climateSrc.replace('{src}', climate.source).replace('{cell}', climate.cell ?? '–')}
        </p>
      </section>

      <p className="sb-3d__hint">{isMobile ? T.hintTouch : interactive ? T.hint : T.hintView}</p>
    </div>
  )
}
