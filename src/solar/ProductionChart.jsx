import { useEffect, useMemo, useRef, useState } from 'react'
import { hhmm } from '../lib/solar/geo'
import { curveAt } from '../lib/solar/seasons'

const H = 200
const PAD = { l: 38, r: 14, t: 16, b: 26 }
const X0 = 5.5 // clock hours shown
const X1 = 19.5
const fmt1 = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })

/** clean y-axis max + step for a kW value */
function niceY(max) {
  const step = max <= 2 ? 0.5 : max <= 5 ? 1 : max <= 12 ? 2 : 5
  return { top: Math.max(step, Math.ceil((max * 1.08) / step) * step), step }
}

/**
 * One-series area chart: PV power (kW) through the day for the chosen season.
 * The cursor follows the 3D animation clock; hover shows a crosshair readout; press/drag scrubs time
 * (pauses the animation). Single series → no legend, the title names it. Table view in <details>.
 */
export default function ProductionChart({ curve, avgCurve, toClock, toSolar, clock, onScrub, title, total, S }) {
  const box = useRef()
  const [w, setW] = useState(600)
  const [hover, setHover] = useState(null)
  const dragging = useRef(false)
  const T = S.stage3d

  useEffect(() => {
    const el = box.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pts = useMemo(() => curve.map((p) => ({ c: toClock(p.h), kw: p.kw })), [curve, toClock])
  const maxKw = Math.max(0.1, ...pts.map((p) => p.kw))
  const { top, step } = niceY(maxKw)
  const x = (c) => PAD.l + ((c - X0) / (X1 - X0)) * (w - PAD.l - PAD.r)
  const y = (kw) => PAD.t + (1 - kw / top) * (H - PAD.t - PAD.b)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.c).toFixed(1)} ${y(p.kw).toFixed(1)}`).join(' ')
  const area = `${line} L${x(pts[pts.length - 1].c).toFixed(1)} ${y(0)} L${x(pts[0].c).toFixed(1)} ${y(0)} Z`
  const kwAt = (c) => curveAt(curve, toSolar(c))
  const avgLine = avgCurve?.length
    ? avgCurve.map((p, i) => `${i ? 'L' : 'M'}${x(toClock(p.h)).toFixed(1)} ${y(p.kw).toFixed(1)}`).join(' ')
    : null

  const clockFromEvent = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * w
    return Math.min(X1, Math.max(X0, X0 + ((px - PAD.l) / (w - PAD.l - PAD.r)) * (X1 - X0)))
  }
  const yTicks = []
  for (let v = 0; v <= top + 1e-9; v += step) yTicks.push(v)
  const xTicks = [6, 8, 10, 12, 14, 16, 18]

  const cur = { c: clock, kw: kwAt(clock) }
  const hv = hover != null ? { c: hover, kw: kwAt(hover) } : null
  const tip = hv ?? cur
  const tipX = Math.min(w - PAD.r - 64, Math.max(PAD.l + 64, x(tip.c)))

  return (
    <figure className="sb-chart">
      <figcaption>
        <b>{title}</b>
        <span>{total}</span>
      </figcaption>
      {avgLine && (
        <ul className="sb-legend">
          <li>
            <i className="sb-legend__line" /> {T.legendClear}
          </li>
          <li>
            <i className="sb-legend__line sb-legend__line--ref" /> {T.legendAvg}
          </li>
        </ul>
      )}
      <div ref={box} className="sb-chart__box">
        <svg
          width={w}
          height={H}
          viewBox={`0 0 ${w} ${H}`}
          role="img"
          aria-label={`${title}. ${total}`}
          onPointerDown={(e) => {
            dragging.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            onScrub(clockFromEvent(e))
          }}
          onPointerMove={(e) => {
            const c = clockFromEvent(e)
            if (dragging.current) onScrub(c)
            else if (e.pointerType === 'mouse') setHover(c)
          }}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          onPointerLeave={() => setHover(null)}
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={w - PAD.r} y1={y(v)} y2={y(v)} className="sb-chart__grid" />
              <text x={PAD.l - 6} y={y(v)} className="sb-chart__tick" textAnchor="end" dominantBaseline="central">
                {v}
              </text>
            </g>
          ))}
          <text x={PAD.l - 6} y={PAD.t - 8} className="sb-chart__tick" textAnchor="end">
            kW
          </text>
          {xTicks.map((c) => (
            <text key={c} x={x(c)} y={H - 8} className="sb-chart__tick" textAnchor="middle">
              {String(c).padStart(2, '0')}:00
            </text>
          ))}
          <path d={area} className="sb-chart__area" />
          {avgLine && <path d={avgLine} className="sb-chart__avg" />}
          <path d={line} className="sb-chart__line" />
          {/* animation cursor */}
          <line x1={x(cur.c)} x2={x(cur.c)} y1={PAD.t} y2={y(0)} className="sb-chart__cursor" />
          <circle cx={x(cur.c)} cy={y(cur.kw)} r="5" className="sb-chart__dot" />
          {hv && <line x1={x(hv.c)} x2={x(hv.c)} y1={PAD.t} y2={y(0)} className="sb-chart__hover" />}
          <g transform={`translate(${tipX} ${PAD.t + 2})`} className="sb-chart__tip">
            <rect x="-62" y="-2" width="124" height="22" rx="6" />
            <text x="0" y="13" textAnchor="middle">
              {hhmm(tip.c)} · {fmt1(tip.kw)} kW
            </text>
          </g>
        </svg>
      </div>
      <details className="sb-assume">
        <summary>{T.table}</summary>
        <table className="sb-chart__table">
          <thead>
            <tr>
              <th>{T.time}</th>
              <th>{T.colClear}</th>
              {avgCurve?.length ? <th>{T.colAvg}</th> : null}
            </tr>
          </thead>
          <tbody>
            {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((c) => (
              <tr key={c}>
                <td>{String(c).padStart(2, '0')}:00</td>
                <td>{fmt1(kwAt(c))}</td>
                {avgCurve?.length ? <td>{fmt1(curveAt(avgCurve, toSolar(c)))}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
