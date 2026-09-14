import { P, Led } from '../Prim'
import { mat } from '../materials'

/** Shared PV parts used by every house variant (group "solar"). */
export const TILT = -24 * (Math.PI / 180) // tilt toward +x — faces the Solar Cell camera

/** One framed PV module on a tilted rack */
export function Panel({ position, w = 1.0, d = 0.78 }) {
  return (
    <group position={position} rotation={[0, 0, TILT]}>
      <P geo="box" args={[w, 0.035, d]} m={mat('solar', 'metal')} />
      <P geo="box" args={[w - 0.04, 0.012, d - 0.04]} position={[0, 0.024, 0]} m={mat('solar', 'solar')} />
    </group>
  )
}

/** Tilted rack of PV modules: `rows` along x (each row tilts toward +x), `cols` along z */
export function SolarArray({ position, cols, rows, name, rotation = [0, 0, 0] }) {
  const w = 1.06
  const d = 0.84
  return (
    <group name={name} position={position} rotation={rotation}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <Panel key={`${r}-${c}`} position={[(r - (rows - 1) / 2) * w, 0.24, (c - (cols - 1) / 2) * d]} />
        )),
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <group key={r} position={[(r - (rows - 1) / 2) * w, 0, 0]}>
          <P geo="box" args={[0.05, 0.04, cols * d]} position={[0.45, 0.06, 0]} m={mat('solar', 'darkMetal')} />
          <P geo="box" args={[0.05, 0.04, cols * d]} position={[-0.45, 0.4, 0]} m={mat('solar', 'darkMetal')} />
          {Array.from({ length: cols + 1 }).map((_, c) => (
            <P key={c} geo="box" args={[0.05, 0.38, 0.05]} position={[-0.45, 0.2, (c - cols / 2) * d]} m={mat('solar', 'darkMetal')} />
          ))}
        </group>
      ))}
    </group>
  )
}

/** Flush-mounted PV on a sloped roof (no rack) — pass the roof slope as `rotation` */
export function FlushArray({ position, cols, rows, name, rotation = [0, 0, 0], w = 1.0, d = 0.78 }) {
  return (
    <group name={name} position={position} rotation={rotation}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <group key={`${r}-${c}`} position={[(r - (rows - 1) / 2) * (w + 0.06), 0.03, (c - (cols - 1) / 2) * (d + 0.06)]}>
            <P geo="box" args={[w, 0.035, d]} m={mat('solar', 'metal')} />
            <P geo="box" args={[w - 0.04, 0.012, d - 0.04]} position={[0, 0.024, 0]} m={mat('solar', 'solar')} />
          </group>
        )),
      )}
    </group>
  )
}

/** Wall-mounted inverter */
export function Inverter({ position, rotation = [0, 0, 0] }) {
  return (
    <group name="SOLAR_INVERTER" position={position} rotation={rotation}>
      <P geo="box" args={[0.14, 0.5, 0.36]} m={mat('solar', 'white')} />
      <P geo="box" args={[0.02, 0.12, 0.2]} position={[0.075, 0.1, 0]} m={mat('solar', 'emissive', { color: '#35d6ff', intensity: 1.6 })} shadow={false} />
      <Led position={[0.08, -0.12, 0.08]} color="#7cf5c2" size={0.02} group="solar" blink={2.5} />
      <P geo="cylinder" args={[0.015, 0.015, 0.8, 6]} position={[0.07, -0.6, 0]} m={mat('solar', 'darkMetal')} />
    </group>
  )
}

/** Vertical wood / aluminium slats (brise-soleil) along x */
export function Slats({ position, width, height, count, rotation = [0, 0, 0], m, thickness = 0.04 }) {
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: count }).map((_, i) => (
        <P key={i} geo="box" args={[thickness, height, 0.08]} position={[-width / 2 + (i * width) / (count - 1), 0, 0]} m={m} />
      ))}
    </group>
  )
}

/** Glass railing along x */
export function Railing({ position, length, rotation = [0, 0, 0], group = 'house' }) {
  return (
    <group position={position} rotation={rotation}>
      <P geo="box" args={[length, 0.9, 0.03]} position={[0, 0.45, 0]} m={mat(group, 'glassTint')} shadow={false} />
      <P geo="box" args={[length, 0.04, 0.05]} position={[0, 0.9, 0]} m={mat(group, 'metal')} />
    </group>
  )
}

/** Pool: coping + water */
export function Pool({ position, w, d, group = 'house' }) {
  return (
    <group position={position}>
      <P geo="box" args={[w + 0.5, 0.12, d + 0.5]} position={[0, 0.06, 0]} m={mat(group, 'white', { color: '#d5dbe3' })} />
      <P geo="box" args={[w, 0.3, d]} position={[0, 0.0, 0]} m={mat(group, 'glassTint', { color: '#1b6fa0', opacity: 0.9 })} shadow={false} />
      <P geo="box" args={[w, 0.02, d]} position={[0, 0.1, 0]} m={mat(group, 'water')} shadow={false} />
    </group>
  )
}

/** Simple EV in a carport */
export function Car({ position, rotation = 0, color = '#dfe6ef' }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <P geo="box" args={[1.9, 0.45, 0.9]} position={[0, 0.42, 0]} m={mat('house', 'white', { color })} />
      <P geo="box" args={[1.1, 0.4, 0.82]} position={[-0.1, 0.82, 0]} m={mat('house', 'glassTint', { color: '#7fb6ff', opacity: 0.6 })} />
      {[-0.6, 0.6].map((x) =>
        [-0.45, 0.45].map((z) => (
          <P key={`${x}${z}`} geo="cylinder" args={[0.2, 0.2, 0.16, 16]} position={[x, 0.2, z]} rotation={[Math.PI / 2, 0, 0]} m={mat('house', 'body', { color: '#0b0f18' })} />
        )),
      )}
      <P geo="box" args={[0.05, 0.06, 0.6]} position={[0.95, 0.5, 0]} m={mat('house', 'emissive', { color: '#ffffff', intensity: 1.5 })} shadow={false} />
    </group>
  )
}
