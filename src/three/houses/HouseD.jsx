import { P, ZoneRing } from '../Prim'
import { mat } from '../materials'
import HitBox from '../HitBox'
import { SolarArray, Inverter, Slats } from './Solar'

const H = (kind, o) => mat('house', kind, o)
const WARM = { color: '#ffb86b', intensity: 0.8 }

/**
 * D — "Tropical Modern"
 * Raised stone plinth, a light two-storey volume wrapped in aluminium
 * louvres, and a wide floating roof with deep eaves on slim columns —
 * PV on the roof, a reflecting pond along the front, sculptural trees.
 */
export default function HouseD() {
  const cols = [-3.0, 3.0]
  return (
    <group name="SMART_HOUSE_ROOT">
      <ZoneRing position={[0, 0.012, 0]} radius={4.8} color="#ffc857" group="solar" />
      {/* stone plinth + steps */}
      <P geo="box" args={[6.4, 0.5, 4.6]} position={[0, 0.25, -0.2]} m={H('stone')} />
      {[0, 1, 2].map((i) => (
        <P key={i} geo="box" args={[2.4, 0.16, 0.4]} position={[0.8, 0.08 + i * 0.16, 2.4 - i * 0.36]} m={H('stone')} />
      ))}
      {/* reflecting pond along the front */}
      <P geo="box" args={[6.0, 0.06, 1.0]} position={[-0.6, 0.03, 2.5]} m={H('body', { color: '#0e2a3d' })} />
      <P geo="box" args={[6.0, 0.02, 1.0]} position={[-0.6, 0.07, 2.5]} m={H('water')} shadow={false} />

      <group name="SMART_HOUSE">
        {/* ground floor — glass living hall */}
        <P geo="box" args={[5.0, 1.5, 3.2]} position={[0, 1.25, -0.2]} m={H('glassTint', { color: '#a8dcff', opacity: 0.22 })} shadow={false} />
        <P geo="box" args={[4.2, 1.3, 2.4]} position={[0, 1.25, -0.2]} m={H('emissive', WARM)} shadow={false} />
        <P geo="box" args={[1.6, 1.5, 3.2]} position={[-1.7, 1.25, -0.2]} m={H('stone')} />
        {/* first floor — white volume with louvres */}
        <P geo="box" args={[5.2, 1.3, 3.4]} position={[0, 2.65, -0.2]} m={H('white')} />
        <P geo="box" args={[3.0, 0.7, 0.06]} position={[0.6, 2.65, 1.53]} m={H('glassTint')} shadow={false} />
        <P geo="plane" args={[2.9, 0.6]} position={[0.6, 2.65, 1.46]} m={H('emissive', WARM)} shadow={false} />
        <Slats position={[0.6, 2.65, 1.62]} width={3.2} height={1.2} count={17} m={H('metal')} thickness={0.03} />
        <Slats position={[2.62, 2.65, -0.2]} width={3.2} height={1.2} count={17} rotation={[0, Math.PI / 2, 0]} m={H('metal')} thickness={0.03} />
        {/* balcony */}
        <P geo="box" args={[2.4, 0.1, 1.0]} position={[1.2, 2.0, 1.9]} m={H('white', { color: '#d5dbe3' })} />
        <P geo="box" args={[2.4, 0.5, 0.03]} position={[1.2, 2.3, 2.38]} m={H('glassTint')} shadow={false} />
        {/* floating roof with deep eaves */}
        <P geo="box" args={[7.6, 0.16, 5.8]} position={[0, 3.55, -0.2]} m={H('white', { color: '#d9dfe6' })} />
        <P geo="box" args={[7.6, 0.06, 5.8]} position={[0, 3.44, -0.2]} m={H('wood')} />
        <P geo="box" args={[7.62, 0.02, 0.03]} position={[0, 3.64, 2.7]} m={H('emissive', { color: '#35d6ff', intensity: 2 })} shadow={false} />
        <P geo="box" args={[0.03, 0.02, 5.82]} position={[3.81, 3.64, -0.2]} m={H('emissive', { color: '#35d6ff', intensity: 2 })} shadow={false} />
        {/* slim steel columns at the eave corners */}
        {cols.map((x) =>
          [-2.6, 2.2].map((z) => <P key={`${x}${z}`} geo="cylinder" args={[0.04, 0.04, 3.0, 10]} position={[x + (x > 0 ? 0.5 : -0.5), 2.0, z]} m={H('darkMetal')} />),
        )}
        {/* roof-edge downlights */}
        {[-2.4, 0, 2.4].map((x) => (
          <P key={x} geo="box" args={[0.2, 0.01, 0.12]} position={[x, 3.43, 2.4]} m={H('emissive', { color: '#fff1d6', intensity: 1.4 })} shadow={false} />
        ))}
        {/* sculptural trees in the plinth */}
        <P geo="cylinder" args={[0.05, 0.08, 1.2, 7]} position={[-2.9, 1.1, 1.4]} m={mat('base', 'bark')} />
        <P geo="icosahedron" args={[0.5, 1]} position={[-2.9, 1.9, 1.4]} rotation={[0.4, 0.3, 0]} m={mat('base', 'foliage2')} />
        <P geo="cylinder" args={[0.05, 0.08, 1.0, 7]} position={[2.9, 1.0, -1.6]} m={mat('base', 'bark')} />
        <P geo="icosahedron" args={[0.42, 1]} position={[2.9, 1.7, -1.6]} rotation={[0.2, 0.9, 0]} m={mat('base', 'foliage')} />
      </group>

      <SolarArray name="SOLAR_PANELS" position={[-0.6, 3.63, -0.2]} cols={4} rows={3} />
      <SolarArray name="SOLAR_PANELS_02" position={[2.6, 3.63, -0.2]} cols={4} rows={1} />
      <Inverter position={[2.68, 1.3, -1.2]} />

      <HitBox serviceId="solar" position={[0.3, 3.95, -0.2]} args={[7.2, 0.9, 4.0]} />
    </group>
  )
}
