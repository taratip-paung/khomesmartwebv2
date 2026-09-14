import { P, ZoneRing } from '../Prim'
import { mat } from '../materials'
import HitBox from '../HitBox'
import { SolarArray, Inverter, Slats, Railing, Pool } from './Solar'

const H = (kind, o) => mat('house', kind, o)
const WARM = { color: '#ffb86b', intensity: 0.8 }

/**
 * A — "Cantilever Villa"
 * Dark-composite ground floor with full-height glass, white upper volume
 * cantilevered over the terrace, timber brise-soleil, roof-deck PV,
 * lap pool on the terrace.
 */
export default function HouseA() {
  return (
    <group name="SMART_HOUSE_ROOT">
      <ZoneRing position={[0.3, 0.012, 0]} radius={4.6} color="#ffc857" group="solar" />
      {/* plinth + terrace */}
      <P geo="box" args={[7.0, 0.16, 6.0]} position={[0.2, 0.08, 0]} m={H('concrete')} />
      <P geo="box" args={[4.6, 0.02, 2.0]} position={[1.0, 0.17, 2.0]} m={H('white', { color: '#cfd6de' })} />
      <Pool position={[-1.8, 0.14, 2.2]} w={2.2} d={1.0} />

      <group name="SMART_HOUSE">
        {/* ground floor */}
        <P geo="box" args={[4.6, 1.6, 3.6]} position={[0, 0.96, 0]} m={H('body')} />
        <P geo="box" args={[3.6, 1.3, 0.08]} position={[0.3, 0.98, 1.81]} m={H('glassTint')} shadow={false} />
        <P geo="plane" args={[3.4, 1.2]} position={[0.3, 0.98, 1.65]} m={H('emissive', WARM)} shadow={false} />
        <P geo="box" args={[0.08, 0.9, 2.0]} position={[2.31, 1.0, -0.4]} m={H('glassTint')} shadow={false} />
        <P geo="plane" args={[1.9, 0.8]} position={[2.26, 1.0, -0.4]} rotation={[0, Math.PI / 2, 0]} m={H('emissive', WARM)} shadow={false} />
        {/* slim glazing mullions */}
        {[-1.0, 0.3, 1.6].map((x) => (
          <P key={x} geo="box" args={[0.04, 1.3, 0.1]} position={[x, 0.98, 1.82]} m={H('darkMetal')} />
        ))}
        {/* lower roof slab (PV on the exposed right part) */}
        <P geo="box" args={[4.8, 0.14, 3.8]} position={[0, 1.83, 0]} m={H('body', { color: '#0f1524' })} />
        {/* upper cantilevered volume */}
        <P geo="box" args={[3.6, 1.4, 3.2]} position={[-0.7, 2.6, -0.1]} m={H('white')} />
        <P geo="box" args={[3.64, 0.6, 3.24]} position={[-0.7, 2.5, -0.1]} m={H('glassTint')} shadow={false} />
        <P geo="box" args={[3.4, 0.5, 3.0]} position={[-0.7, 2.5, -0.1]} m={H('emissive', { color: '#ffc57a', intensity: 0.45 })} shadow={false} />
        {/* timber brise-soleil on the front of the upper volume */}
        <Slats position={[-0.7, 2.6, 1.56]} width={3.2} height={1.3} count={13} m={H('wood')} />
        {/* upper roof slab + LED parapet */}
        <P geo="box" args={[3.8, 0.12, 3.4]} position={[-0.7, 3.36, -0.1]} m={H('body', { color: '#0f1524' })} />
        <P geo="box" args={[3.82, 0.02, 0.03]} position={[-0.7, 3.42, 1.6]} m={H('emissive', { color: '#35d6ff', intensity: 2.2 })} shadow={false} />
        <P geo="box" args={[0.03, 0.02, 3.42]} position={[1.21, 3.42, -0.1]} m={H('emissive', { color: '#35d6ff', intensity: 2.2 })} shadow={false} />
        {/* roof deck railing on the lower roof */}
        <Railing position={[1.55, 1.9, 1.85]} length={1.6} />
        <Railing position={[2.35, 1.9, 0.9]} length={1.9} rotation={[0, Math.PI / 2, 0]} />
        {/* entrance canopy + column */}
        <P geo="box" args={[1.6, 0.08, 1.0]} position={[1.6, 1.55, 2.2]} m={H('white')} />
        <P geo="box" args={[0.06, 1.4, 0.06]} position={[2.3, 0.85, 2.6]} m={H('darkMetal')} />
        <P geo="box" args={[0.8, 1.3, 0.04]} position={[1.4, 0.82, 1.83]} m={H('wood')} />
        {/* planter */}
        <P geo="box" args={[1.2, 0.35, 0.5]} position={[-2.6, 0.33, 1.2]} m={H('concrete', { color: '#3a4252' })} />
        <P geo="icosahedron" args={[0.3, 1]} position={[-2.9, 0.65, 1.2]} m={mat('base', 'foliage2')} />
        <P geo="icosahedron" args={[0.26, 1]} position={[-2.3, 0.62, 1.2]} m={mat('base', 'foliage')} />
      </group>

      <SolarArray name="SOLAR_PANELS" position={[-0.7, 3.42, -0.1]} cols={3} rows={3} />
      <SolarArray name="SOLAR_PANELS_02" position={[1.6, 1.9, -0.3]} cols={2} rows={1} />
      <Inverter position={[2.38, 0.85, -1.6]} />

      <HitBox serviceId="solar" position={[-0.7, 3.75, -0.1]} args={[3.9, 0.9, 3.5]} />
      <HitBox serviceId="solar" position={[1.6, 2.15, -0.3]} args={[1.3, 0.7, 2.0]} />
    </group>
  )
}
