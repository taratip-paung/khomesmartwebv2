import { useMemo, useRef } from 'react'
import { sunPosition } from '../lib/solar/production'

const R = 150 // horizon radius in the polar plot
const C = 180 // centre

/** polar projection: azimuth clockwise from north (up), zenith at centre */
function project(az, el) {
  const r = ((90 - el) / 90) * R
  const a = ((az - 90) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}

function sunPath(lat, day) {
  const pts = []
  for (let h = 5; h <= 19; h += 0.25) {
    const s = sunPosition(lat, day, h)
    if (s.elevation > 0) pts.push(project(s.azimuth, s.elevation))
  }
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
}

/**
 * Top view: compass + the sun's path on the solstices over this latitude + the house,
 * rotated so its panel side faces `azimuth`. Drag anywhere on the dial to turn the house.
 */
export default function OrientView({ lat = 18.79, azimuth, roof, onAzimuth, labels }) {
  const svg = useRef()
  const paths = useMemo(() => ({ jun: sunPath(lat, 172), dec: sunPath(lat, 355), mar: sunPath(lat, 80) }), [lat])
  const dragging = useRef(false)

  const fromPointer = (e) => {
    const r = svg.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 360 - C
    const y = ((e.clientY - r.top) / r.height) * 360 - C
    const az = ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360
    onAzimuth?.(Math.round(az / 5) * 5 % 360)
  }

  const ticks = []
  for (let d = 0; d < 360; d += 15) {
    const [x1, y1] = project(d, 0)
    const [x2, y2] = project(d, d % 45 ? 4 : 8)
    ticks.push(<line key={d} x1={x1} y1={y1} x2={x2} y2={y2} className="ov__tick" />)
  }
  const dirs = [['N', 0], ['E', 90], ['S', 180], ['W', 270]]

  return (
    <svg
      ref={svg}
      className="ov"
      viewBox="0 0 360 360"
      role="img"
      aria-label={labels?.aria}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        fromPointer(e)
      }}
      onPointerMove={(e) => dragging.current && fromPointer(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <circle cx={C} cy={C} r={R} className="ov__horizon" />
      <circle cx={C} cy={C} r={R * (2 / 3)} className="ov__ring" />
      <circle cx={C} cy={C} r={R / 3} className="ov__ring" />
      {ticks}
      {dirs.map(([k, d]) => {
        const [x, y] = project(d, -9)
        return (
          <text key={k} x={x} y={y} className={`ov__dir${k === 'N' ? ' is-n' : ''}`} textAnchor="middle" dominantBaseline="central">
            {k}
          </text>
        )
      })}

      <path d={paths.jun} className="ov__sun ov__sun--jun" />
      <path d={paths.mar} className="ov__sun ov__sun--mar" />
      <path d={paths.dec} className="ov__sun ov__sun--dec" />

      {/* house — panel side faces "up" before rotation */}
      <g transform={`rotate(${azimuth} ${C} ${C})`} className="ov__house">
        <rect x={C - 46} y={C - 34} width={92} height={68} rx={4} className="ov__body" />
        {roof === 'flat' ? (
          <g className="ov__pv">
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={C - 40 + i * 20.5} y={C - 28} width={18} height={26} rx={1.5} />
            ))}
          </g>
        ) : (
          <>
            <line x1={C - 46} y1={C} x2={C + 46} y2={C} className="ov__ridge" />
            {roof === 'hip' && (
              <path d={`M${C - 46} ${C - 34} L${C - 22} ${C} L${C - 46} ${C + 34} M${C + 46} ${C - 34} L${C + 22} ${C} L${C + 46} ${C + 34}`} className="ov__ridge" />
            )}
            <g className="ov__pv">
              {[0, 1, 2].map((i) => (
                <rect key={i} x={C - 30 + i * 20.5} y={C - 30} width={18} height={26} rx={1.5} />
              ))}
            </g>
          </>
        )}
        <path d={`M${C} ${C - 44} L${C} ${C - 96}`} className="ov__arrow" />
        <path d={`M${C - 8} ${C - 86} L${C} ${C - 100} L${C + 8} ${C - 86} Z`} className="ov__arrowhead" />
      </g>
    </svg>
  )
}
