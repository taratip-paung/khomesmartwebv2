import { P, ZoneRing } from '../Prim'
import { mat } from '../materials'
import HitBox from '../HitBox'
import { FlushArray, Inverter, Slats, Car } from './Solar'

const H = (kind, o) => mat('house', kind, o)
const WARM = { color: '#ffb86b', intensity: 0.8 }
const RISE = 1.4
const SLOPE = Math.atan2(RISE, 5.2) // mono-pitch roof, high on -x, low on +x
const ROOF_Y = 2.16 + RISE / 2 + 0.07

/**
 * C — "Mono-slope Timber"
 * Long single volume with a mono-pitch roof carrying flush-mounted PV,
 * vertical timber cladding, a two-storey glazed tower at the end,
 * and a carport with an EV.
 */
export default function HouseC() {
  return (
    <group name="SMART_HOUSE_ROOT">
      <ZoneRing position={[0.2, 0.012, 0]} radius={4.6} color="#ffc857" group="solar" />
      <P geo="box" args={[7.2, 0.16, 5.8]} position={[0.2, 0.08, 0.2]} m={H('concrete')} />
      {/* deck */}
      <P geo="box" args={[3.6, 0.04, 1.6]} position={[-1.0, 0.18, 2.0]} m={H('wood')} />

      <group name="SMART_HOUSE">
        {/* main volume: 5.2 × 3.4, walls 2.0 high, roof slopes */}
        <P geo="box" args={[5.2, 2.0, 3.4]} position={[-0.4, 1.16, 0]} m={H('body', { color: '#1c2333' })} />
        {/* timber cladding on the front and back */}
        <Slats position={[-0.4, 1.16, 1.72]} width={5.0} height={1.96} count={24} m={H('wood')} thickness={0.06} />
        <Slats position={[-0.4, 1.16, -1.72]} width={5.0} height={1.96} count={24} m={H('wood')} thickness={0.06} />
        {/* big sliding glass opening in the front (cuts through the slats visually) */}
        <P geo="box" args={[2.6, 1.7, 0.2]} position={[-1.0, 1.05, 1.78]} m={H('glassTint')} shadow={false} />
        <P geo="plane" args={[2.5, 1.6]} position={[-1.0, 1.05, 1.6]} m={H('emissive', WARM)} shadow={false} />
        {/* wall infill under the mono-pitch roof (true wedge) + timber on its faces */}
        <P geo="wedge" args={[5.2, RISE, 3.4]} position={[-0.4, 2.16, 0]} m={H('body', { color: '#1c2333' })} />
        <P geo="wedge" args={[5.2, RISE, 3.5]} position={[-0.4, 2.16, 0]} m={H('wood')} scale={[0.985, 0.985, 1]} />
        {/* roof slab following the slope */}
        <group position={[-0.4, ROOF_Y, 0]} rotation={[0, 0, -SLOPE]}>
          <P geo="box" args={[6.0, 0.14, 4.0]} m={H('white', { color: '#d5dbe3' })} />
          <P geo="box" args={[6.02, 0.03, 0.04]} position={[0, 0.08, 2.0]} m={H('emissive', { color: '#35d6ff', intensity: 2 })} shadow={false} />
        </group>
        {/* glazed tower at the -x end */}
        <P geo="box" args={[2.2, 4.0, 2.6]} position={[-2.5, 2.16, -0.3]} m={H('white')} />
        <P geo="box" args={[2.24, 1.1, 2.64]} position={[-2.5, 3.3, -0.3]} m={H('glassTint')} shadow={false} />
        <P geo="box" args={[2.0, 1.0, 2.4]} position={[-2.5, 3.3, -0.3]} m={H('emissive', { color: '#ffc57a', intensity: 0.5 })} shadow={false} />
        <P geo="box" args={[2.4, 0.12, 2.8]} position={[-2.5, 4.22, -0.3]} m={H('body', { color: '#0f1524' })} />
        {/* carport at the +x/+z corner, connecting to the road */}
        <P geo="box" args={[2.8, 0.08, 2.6]} position={[1.9, 2.05, 1.6]} m={H('white', { color: '#d5dbe3' })} />
        {[0.7, 3.1].map((x) =>
          [0.5, 2.7].map((z) => <P key={`${x}${z}`} geo="box" args={[0.08, 2.0, 0.08]} position={[x, 1.05, z]} m={H('darkMetal')} />),
        )}
        <P geo="box" args={[2.6, 0.02, 0.03]} position={[1.9, 2.0, 2.9]} m={H('emissive', { color: '#35d6ff', intensity: 1.6 })} shadow={false} />
        <Car position={[1.9, 0.16, 1.6]} rotation={Math.PI / 2} />
        {/* EV charger post */}
        <P geo="box" args={[0.2, 1.1, 0.14]} position={[0.75, 0.7, 1.0]} m={H('white')} />
        <P geo="box" args={[0.14, 0.2, 0.02]} position={[0.75, 0.95, 1.08]} m={H('emissive', { color: '#7cf5c2', intensity: 1.8 })} shadow={false} />
        {/* planters */}
        <P geo="box" args={[0.6, 0.4, 2.4]} position={[-3.9, 0.36, 1.0]} m={H('concrete', { color: '#3a4252' })} />
        <P geo="icosahedron" args={[0.3, 1]} position={[-3.9, 0.75, 0.3]} m={mat('base', 'foliage2')} />
        <P geo="icosahedron" args={[0.28, 1]} position={[-3.9, 0.72, 1.6]} m={mat('base', 'foliage')} />
      </group>

      {/* PV flush on the slope: roof top surface is at local y=+0.07 */}
      <group position={[-0.4, ROOF_Y, 0]} rotation={[0, 0, -SLOPE]}>
        <FlushArray name="SOLAR_PANELS" position={[0.3, 0.08, 0]} cols={4} rows={4} />
      </group>
      <FlushArray name="SOLAR_PANELS_02" position={[1.9, 2.1, 1.6]} cols={3} rows={2} />
      <Inverter position={[2.27, 0.9, -1.0]} />

      <HitBox serviceId="solar" position={[-0.2, 3.3, 0]} args={[5.8, 1.2, 3.8]} />
      <HitBox serviceId="solar" position={[1.9, 2.2, 1.6]} args={[2.8, 0.5, 2.6]} />
    </group>
  )
}
