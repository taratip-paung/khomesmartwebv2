import { P, Led, ZoneRing } from './Prim'
import { mat } from './materials'
import HitBox from './HitBox'

const TILT = -24 * (Math.PI / 180) // panels tilt toward +x (right side, facing the solar camera)

/** One framed PV module: dark-blue cell glass in an aluminium frame, on a rack. */
function Panel({ position }) {
  return (
    <group position={position} rotation={[0, 0, TILT]}>
      <P geo="box" args={[1.0, 0.035, 0.78]} m={mat('solar', 'metal')} />
      <P geo="box" args={[0.96, 0.012, 0.74]} position={[0, 0.024, 0]} m={mat('solar', 'solar')} />
    </group>
  )
}

/** Tilted rack of PV modules: `cols` × `rows` */
/** Tilted rack of PV modules: `rows` along x (each row tilts toward +x), `cols` along z */
function SolarArray({ position, cols, rows, name }) {
  const w = 1.06 // pitch along x (row spacing)
  const d = 0.84 // pitch along z (module spacing)
  return (
    <group name={name} position={position}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <Panel key={`${r}-${c}`} position={[(r - (rows - 1) / 2) * w, 0.24, (c - (cols - 1) / 2) * d]} />
        )),
      )}
      {/* rack rails: low rail on +x, high rail on -x */}
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

/**
 * SMART_HOUSE — two-storey modern villa: dark composite base, white cantilevered
 * upper volume with a continuous glass band, flat roofs carrying SOLAR_PANELS,
 * SOLAR_INVERTER on the side wall. Group "house" for the building, "solar" for PV.
 */
export default function SmartHouse() {
  return (
    <group name="SMART_HOUSE_ROOT">
      <ZoneRing position={[0.3, 0.012, 0]} radius={4.4} color="#ffc857" group="solar" />
      {/* plinth + terrace */}
      <P geo="box" args={[6.4, 0.16, 5.6]} position={[0.2, 0.08, 0]} m={mat('house', 'concrete')} />
      <P geo="box" args={[2.6, 0.02, 1.6]} position={[1.6, 0.17, 2.0]} m={mat('house', 'white', { color: '#c9d2dc' })} />
      {/* ground floor */}
      <group name="SMART_HOUSE">
        <P geo="box" args={[4.4, 1.55, 3.5]} position={[0, 0.94, 0]} m={mat('house', 'body')} />
        {/* front glass facade + warm interior */}
        <P geo="box" args={[3.2, 1.25, 0.08]} position={[0.3, 0.95, 1.76]} m={mat('house', 'glassTint')} shadow={false} />
        <P geo="plane" args={[3.0, 1.15]} position={[0.3, 0.95, 1.6]} m={mat('house', 'emissive', { color: '#ffb86b', intensity: 0.9 })} shadow={false} />
        {/* side window */}
        <P geo="box" args={[0.08, 0.8, 1.6]} position={[2.21, 1.0, -0.4]} m={mat('house', 'glassTint')} shadow={false} />
        <P geo="plane" args={[1.5, 0.7]} position={[2.16, 1.0, -0.4]} rotation={[0, Math.PI / 2, 0]} m={mat('house', 'emissive', { color: '#ffb86b', intensity: 0.7 })} shadow={false} />
        {/* lower flat roof (right part stays exposed → PV) */}
        <P geo="box" args={[4.6, 0.12, 3.7]} position={[0, 1.76, 0]} m={mat('house', 'body', { color: '#0f1524' })} />
        {/* upper cantilevered volume */}
        <P geo="box" args={[3.4, 1.35, 3.0]} position={[-0.6, 2.5, -0.2]} m={mat('house', 'white')} />
        <P geo="box" args={[3.44, 0.55, 3.04]} position={[-0.6, 2.45, -0.2]} m={mat('house', 'glassTint')} shadow={false} />
        <P geo="box" args={[3.2, 0.45, 2.8]} position={[-0.6, 2.45, -0.2]} m={mat('house', 'emissive', { color: '#ffc57a', intensity: 0.5 })} shadow={false} />
        {/* upper roof slab + parapet LED strip */}
        <P geo="box" args={[3.6, 0.1, 3.2]} position={[-0.6, 3.22, -0.2]} m={mat('house', 'body', { color: '#0f1524' })} />
        <P geo="box" args={[3.62, 0.02, 0.03]} position={[-0.6, 3.27, 1.4]} m={mat('house', 'emissive', { color: '#35d6ff', intensity: 2.2 })} shadow={false} />
        <P geo="box" args={[0.03, 0.02, 3.22]} position={[1.21, 3.27, -0.2]} m={mat('house', 'emissive', { color: '#35d6ff', intensity: 2.2 })} shadow={false} />
        <P geo="box" args={[0.03, 0.02, 3.22]} position={[-2.41, 3.27, -0.2]} m={mat('house', 'emissive', { color: '#35d6ff', intensity: 2.2 })} shadow={false} />
        {/* entrance canopy + door */}
        <P geo="box" args={[1.3, 0.06, 0.9]} position={[1.3, 1.5, 2.1]} m={mat('house', 'white')} />
        <P geo="box" args={[0.04, 1.3, 0.04]} position={[1.9, 0.85, 2.5]} m={mat('house', 'darkMetal')} />
        {/* chimney/vent unit */}
        <P geo="box" args={[0.4, 0.5, 0.4]} position={[-1.8, 3.5, -1.2]} m={mat('house', 'darkMetal')} />
      </group>

      {/* SOLAR_PANELS — upper roof 4×2, lower roof 2×2 */}
      <SolarArray name="SOLAR_PANELS" position={[-0.6, 3.28, -0.2]} cols={3} rows={3} />
      <SolarArray name="SOLAR_PANELS_02" position={[1.55, 1.82, 0.05]} cols={3} rows={1} />

      {/* SOLAR_INVERTER on the right wall */}
      <group name="SOLAR_INVERTER" position={[2.28, 0.85, 1.0]}>
        <P geo="box" args={[0.14, 0.5, 0.36]} m={mat('solar', 'white')} />
        <P geo="box" args={[0.02, 0.12, 0.2]} position={[0.075, 0.1, 0]} m={mat('solar', 'emissive', { color: '#35d6ff', intensity: 1.6 })} shadow={false} />
        <Led position={[0.08, -0.12, 0.08]} color="#7cf5c2" size={0.02} group="solar" blink={2.5} />
        <P geo="cylinder" args={[0.015, 0.015, 0.8, 6]} position={[0.07, -0.6, 0]} m={mat('solar', 'darkMetal')} />
      </group>

      <HitBox serviceId="solar" position={[-0.6, 3.6, -0.2]} args={[3.8, 0.9, 3.4]} />
      <HitBox serviceId="solar" position={[1.6, 2.1, 0]} args={[1.2, 0.7, 2.6]} />
    </group>
  )
}
