import { useEffect, useRef, useState } from 'react'
import { usePreviewNumbers } from './Steps'
import { kwhFor, marginal, layoutSteps, DC_TO_AC } from '../lib/solar/layout'

const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d })
const H = 190
const PAD = { l: 50, r: 14, t: 24, b: 30 }

/**
 * Panel count on Google's own layout for this roof (buildingInsights solarPanelConfigs + solarPanels).
 * Step 2: slider only — the map draws the first N panels Google placed.
 * Step 3 (`chart`): + "more panels ≠ proportionally more energy" chart: actual layout energy vs a straight line
 * "if every panel were as good as the first ones", with the marginal energy of the N-th panel.
 */
export default function LayoutPicker({ state, set, S, ins, chart = false }) {
  const { curve, n, kwp, annualKwh, areaM2, panel } = usePreviewNumbers(state, ins)
  const L = S.layout
  if (!n) return ins?.status === 'found' ? <p className="sb-note">{L.none}</p> : null
  const steps = layoutSteps(curve)
  const idx = Math.max(0, steps.findIndex((s) => s >= n))
  return (
    <section className="sb-layout">
      <h3>{L.h}</h3>
      {!chart && <p className="sb-p">{L.p}</p>}
      <label className="sb-field">
        <span className="sb-field__label">
          {L.count}
          <b>{L.readout.replace('{n}', n).replace('{w}', panel.wp).replace('{kwp}', fmt(kwp, 2)).replace('{a}', fmt(areaM2)).replace('{kwh}', fmt(annualKwh))}</b>
        </span>
        <input type="range" min="0" max={steps.length - 1} step="1" value={idx} onChange={(e) => set({ pn: steps[+e.target.value] })} aria-label={L.count} />
      </label>
      {chart && <LayoutChart curve={curve} n={n} L={L} onPick={(v) => set({ pn: steps.reduce((a, s) => (Math.abs(s - v) < Math.abs(a - v) ? s : a), steps[0]) })} />}
      {chart && (
        <p className="sb-note">
          {L.note.replace('{d}', DC_TO_AC).replace('{gw}', ins.data.panelW).replace('{w}', panel.wp).replace('{size}', panel.sizeM.join(' × '))} · {S.sat.attribution}
        </p>
      )}
    </section>
  )
}

function LayoutChart({ curve, n, L, onPick }) {
  const box = useRef()
  const [w, setW] = useState(360)
  useEffect(() => {
    const el = box.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const maxN = curve[curve.length - 1].m
  const first = curve[1]
  const perBest = first.kwh / first.m // "every panel as good as the first ones"
  const top = niceTop(Math.max(perBest * maxN, curve[curve.length - 1].kwh))
  const x = (v) => PAD.l + (v / maxN) * (w - PAD.l - PAD.r)
  const y = (v) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b)
  const line = curve.map((p, i) => `${i ? 'L' : 'M'}${x(p.m).toFixed(1)} ${y(p.kwh).toFixed(1)}`).join(' ')
  const kwhN = kwhFor(curve, n)
  const yTicks = [0, top / 2, top]
  const xTicks = [0, Math.round(maxN / 2), maxN]
  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * w
    onPick(Math.round(((px - PAD.l) / (w - PAD.l - PAD.r)) * maxN))
  }
  return (
    <figure className="sb-chart sb-chart--layout">
      <figcaption>
        <b>{L.chartH}</b>
      </figcaption>
      <ul className="sb-legend">
        <li>
          <i className="sb-legend__line" /> {L.actual}
        </li>
        <li>
          <i className="sb-legend__line sb-legend__line--ref" /> {L.ideal}
        </li>
      </ul>
      <div ref={box} className="sb-chart__box">
        <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={L.chartH} onPointerDown={pick}>
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={w - PAD.r} y1={y(v)} y2={y(v)} className="sb-chart__grid" />
              <text x={PAD.l - 6} y={y(v)} className="sb-chart__tick" textAnchor="end" dominantBaseline="central">
                {fmt(v)}
              </text>
            </g>
          ))}
          {xTicks.map((v) => (
            <text key={v} x={x(v)} y={H - 12} className="sb-chart__tick" textAnchor="middle">
              {v}
            </text>
          ))}
          <text x={w - PAD.r} y={H - 1} className="sb-chart__tick" textAnchor="end">
            {L.xAxis}
          </text>
          <text x={4} y={11} className="sb-chart__tick">
            {L.unit}
          </text>
          <line x1={x(0)} y1={y(0)} x2={x(maxN)} y2={y(perBest * maxN)} className="sb-chart__ref" />
          <path d={line} className="sb-chart__line" />
          <line x1={x(n)} x2={x(n)} y1={PAD.t} y2={y(0)} className="sb-chart__cursor" />
          <circle cx={x(n)} cy={y(kwhN)} r="5" className="sb-chart__dot" />
        </svg>
      </div>
      <p className="sb-layout__marg">
        {L.marg.replace('{n}', n).replace('{m}', fmt(marginal(curve, n))).replace('{f}', fmt(perBest))}
      </p>
    </figure>
  )
}

function niceTop(v) {
  const mag = 10 ** Math.floor(Math.log10(v))
  const s = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((k) => k * mag >= v) ?? 10
  return s * mag
}
