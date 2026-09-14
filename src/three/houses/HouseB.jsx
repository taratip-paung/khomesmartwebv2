import { P, ZoneRing } from '../Prim'
import { mat } from '../materials'
import HitBox from '../HitBox'
import { SolarArray, Inverter, Railing, Pool } from './Solar'

const H = (kind, o) => mat('house', kind, o)
const WARM = { color: '#ffc27a', intensity: 0.7 }

/**
 * B — "Glass Pavilion"
 * Fully glazed ground floor (thin steel frame) under a floating white
 * upper box, roof terrace with a pergola, rooftop PV and an infinity pool
 * along the back.
 */
export default function HouseB() {
  const gx = [-2.2, -1.1, 0, 1.1, 2.2]
  return (
    <group name="SMART_HOUSE_ROOT">
      <ZoneRing position={[0, 0.012, 0]} radius={4.6} color="#ffc857" group="solar" />
      <P geo="box" args={[6.8, 0.16, 5.6]} position={[0, 0.08, 0]} m={H('white', { color: '#c8cfd8' })} />
      <Pool position={[0, 0.14, -2.35]} w={3.8} d={0.9} />

      <group name="SMART_HOUSE">
        {/* ground floor: glass box */}
        <P geo="box" args={[4.6, 0.12, 3.4]} position={[0, 0.2, 0]} m={H('body', { color: '#1a2131' })} />
        <P geo="box" args={[4.5, 1.5, 3.3]} position={[0, 1.0, 0]} m={H('glassTint', { color: '#a8dcff', opacity: 0.22 })} shadow={false} />
        <P geo="box" args={[3.6, 1.2, 2.4]} position={[0, 1.0, 0]} m={H('emissive', WARM)} shadow={false} />
        {/* interior: kitchen island + sofa silhouettes */}
        <P geo="box" args={[1.6, 0.5, 0.5]} position={[-0.8, 0.5, -0.6]} m={H('white', { color: '#eef2f6' })} />
        <P geo="box" args={[1.2, 0.35, 0.8]} position={[1.0, 0.42, 0.5]} m={H('body', { color: '#2a3446' })} />
        {/* steel frame */}
        {gx.map((x) => (
          <P key={x} geo="box" args={[0.06, 1.5, 0.06]} position={[x, 1.0, 1.66]} m={H('darkMetal')} />
        ))}
        {gx.map((x) => (
          <P key={`b${x}`} geo="box" args={[0.06, 1.5, 0.06]} position={[x, 1.0, -1.66]} m={H('darkMetal')} />
        ))}
        {[-1.6, 1.6].map((z) =>
          [-2.25, 2.25].map((x) => <P key={`${x}${z}`} geo="box" args={[0.06, 1.5, 0.06]} position={[x, 1.0, z]} m={H('darkMetal')} />),
        )}
        {/* floor slab between storeys — extends into a deep eave */}
        <P geo="box" args={[5.6, 0.16, 4.2]} position={[0, 1.82, 0]} m={H('white')} />
        <P geo="box" args={[5.62, 0.02, 0.03]} position={[0, 1.75, 2.1]} m={H('emissive', { color: '#35d6ff', intensity: 2 })} shadow={false} />
        {/* upper white box, shifted to the left */}
        <P geo="box" args={[3.8, 1.3, 3.0]} position={[-0.8, 2.55, -0.2]} m={H('white')} />
        <P geo="box" args={[2.4, 0.8, 0.06]} position={[-0.6, 2.5, 1.32]} m={H('glassTint')} shadow={false} />
        <P geo="plane" args={[2.2, 0.7]} position={[-0.6, 2.5, 1.25]} m={H('emissive', WARM)} shadow={false} />
        <P geo="box" args={[0.06, 0.8, 2.0]} position={[1.12, 2.5, -0.4]} m={H('glassTint')} shadow={false} />
        {/* roof terrace on the right with pergola */}
        <Railing position={[2.0, 1.9, 2.05]} length={1.6} />
        <Railing position={[2.75, 1.9, 0.6]} length={2.9} rotation={[0, Math.PI / 2, 0]} />
        {[1.4, 2.6].map((x) => (
          <P key={x} geo="box" args={[0.08, 1.2, 0.08]} position={[x, 2.5, 1.7]} m={H('wood')} />
        ))}
        {[-0.2, 0.2, 0.6, 1.0, 1.4].map((z) => (
          <P key={z} geo="box" args={[1.5, 0.05, 0.08]} position={[2.0, 3.1, z + 0.4]} m={H('wood')} />
        ))}
        <P geo="box" args={[0.08, 1.2, 0.08]} position={[1.4, 2.5, 0.2]} m={H('wood')} />
        <P geo="box" args={[0.08, 1.2, 0.08]} position={[2.6, 2.5, 0.2]} m={H('wood')} />
        {/* lounge on the terrace */}
        <P geo="box" args={[0.9, 0.25, 0.5]} position={[2.0, 2.0, 0.9]} m={H('white', { color: '#e9edf1' })} />
        {/* upper roof + parapet LED */}
        <P geo="box" args={[4.0, 0.12, 3.2]} position={[-0.8, 3.26, -0.2]} m={H('body', { color: '#0f1524' })} />
        <P geo="box" args={[4.02, 0.02, 0.03]} position={[-0.8, 3.32, 1.4]} m={H('emissive', { color: '#35d6ff', intensity: 2.2 })} shadow={false} />
        {/* stair to the terrace */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <P key={i} geo="box" args={[0.7, 0.05, 0.28]} position={[2.9, 0.3 + i * 0.28, 1.3 - i * 0.26]} m={H('white', { color: '#d9dfe6' })} />
        ))}
      </group>

      <SolarArray name="SOLAR_PANELS" position={[-0.8, 3.32, -0.2]} cols={3} rows={3} />
      <Inverter position={[-2.7, 0.9, -1.0]} rotation={[0, Math.PI, 0]} />

      <HitBox serviceId="solar" position={[-0.8, 3.65, -0.2]} args={[4.0, 0.9, 3.3]} />
    </group>
  )
}
