import { P, Led, ZoneRing } from '../Prim'
import { mat } from '../materials'
import HitBox from '../HitBox'
import { Slats } from './Solar'

const H = (kind, o) => mat('house', kind, o)

/* ---- interior pieces (group "house") ---- */
function Chair({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <P geo="box" args={[0.34, 0.04, 0.34]} position={[0, 0.42, 0]} m={H('fabric')} />
      <P geo="box" args={[0.34, 0.4, 0.04]} position={[0, 0.62, -0.15]} m={H('fabric')} />
      {[-0.13, 0.13].map((x) =>
        [-0.13, 0.13].map((z) => <P key={`${x}${z}`} geo="cylinder" args={[0.012, 0.012, 0.42, 6]} position={[x, 0.21, z]} m={H('darkMetal')} />),
      )}
    </group>
  )
}

function Pendant({ position, size = 0.22 }) {
  return (
    <group position={position}>
      <P geo="cylinder" args={[0.006, 0.006, 0.5, 4]} position={[0, 0.25, 0]} m={H('darkMetal')} />
      <P geo="cylinder" args={[size, size * 0.8, 0.12, 20, 1, true]} m={H('body', { color: '#1a1f2b' })} />
      <P geo="cylinder" args={[size * 0.75, size * 0.75, 0.02, 20]} position={[0, -0.05, 0]} m={H('emissive', { color: '#ffd9a0', intensity: 2.4 })} shadow={false} />
    </group>
  )
}

function Interior() {
  return (
    <group name="INTERIOR">
      {/* floor, warm timber back wall, ceiling */}
      <P geo="box" args={[6.6, 0.04, 3.3]} position={[0.2, 0.2, 0]} m={H('white', { color: '#cfc7bb' })} />
      <P geo="box" args={[2.4, 1.7, 0.08]} position={[-0.7, 1.05, -1.7]} m={H('wood', { color: '#a8865e' })} />
      <Slats position={[-0.7, 1.05, -1.62]} width={2.0} height={1.66} count={14} m={H('wood', { color: '#c9a67a' })} thickness={0.03} />
      {/* ceiling light coves */}
      <P geo="box" args={[6.4, 0.02, 0.12]} position={[0.2, 1.86, -1.5]} m={H('emissive', { color: '#ffe3b8', intensity: 2 })} shadow={false} />
      <P geo="box" args={[6.4, 0.02, 0.12]} position={[0.2, 1.86, 1.4]} m={H('emissive', { color: '#ffe3b8', intensity: 1.6 })} shadow={false} />
      {/* dining: table + 4 chairs + pendants */}
      <P geo="box" args={[1.5, 0.05, 0.8]} position={[-0.9, 0.72, 0.1]} m={H('white', { color: '#e9e4dc' })} />
      <P geo="box" args={[0.08, 0.5, 0.6]} position={[-1.4, 0.46, 0.1]} m={H('darkMetal')} />
      <P geo="box" args={[0.08, 0.5, 0.6]} position={[-0.4, 0.46, 0.1]} m={H('darkMetal')} />
      <Chair position={[-1.2, 0.2, 0.7]} rotation={Math.PI} />
      <Chair position={[-0.6, 0.2, 0.7]} rotation={Math.PI} />
      <Chair position={[-1.2, 0.2, -0.5]} />
      <Chair position={[-0.6, 0.2, -0.5]} />
      <Pendant position={[-1.25, 1.55, 0.1]} />
      <Pendant position={[-0.55, 1.55, 0.1]} />
      {/* living: sofa, coffee table, rug, fireplace, TV */}
      <P geo="box" args={[2.0, 0.02, 1.4]} position={[1.7, 0.23, 0.2]} m={H('fabric', { color: '#b9b0a4' })} shadow={false} />
      <P geo="box" args={[1.8, 0.38, 0.8]} position={[1.7, 0.42, 0.55]} m={H('fabric', { color: '#d8d2c8' })} />
      <P geo="box" args={[1.8, 0.3, 0.16]} position={[1.7, 0.72, 0.9]} m={H('fabric', { color: '#d8d2c8' })} />
      <P geo="box" args={[0.9, 0.04, 0.5]} position={[1.7, 0.42, -0.3]} m={H('body', { color: '#2b2f38' })} />
      <P geo="box" args={[1.6, 0.5, 0.2]} position={[1.9, 0.46, -1.58]} m={H('blackStone')} />
      <P geo="box" args={[0.7, 0.3, 0.05]} position={[1.9, 0.5, -1.47]} m={H('emissive', { color: '#ff8a3d', intensity: 3 })} shadow={false} />
      <Led position={[1.75, 0.55, -1.45]} color="#ffb060" size={0.03} group="house" blink={9} intensity={4} />
      <Led position={[2.05, 0.52, -1.45]} color="#ff9040" size={0.03} group="house" blink={7} intensity={4} />
      <P geo="box" args={[1.2, 0.65, 0.04]} position={[1.9, 1.25, -1.6]} m={H('body', { color: '#05070c' })} />
      {/* plant */}
      <P geo="cylinder" args={[0.14, 0.11, 0.3, 12]} position={[3.0, 0.37, -1.3]} m={H('white', { color: '#e5e1da' })} />
      <P geo="icosahedron" args={[0.28, 1]} position={[3.0, 0.8, -1.3]} m={mat('base', 'foliage2')} />
      {/* interior lights (no shadows — cheap) */}
      <pointLight position={[-0.9, 1.5, 0.1]} intensity={6} distance={5} decay={2} color="#ffd6a0" />
      <pointLight position={[1.9, 1.5, 0.2]} intensity={5} distance={5} decay={2} color="#ffd6a0" />
      <pointLight position={[1.9, 0.6, -1.2]} intensity={3} distance={3} decay={2} color="#ff9a4a" />
    </group>
  )
}

/**
 * E — "Reference Villa" (from the owner's reference image)
 * Ground floor: black stone wall + full-height glazing with black mullions,
 * lit interior (dining, living, fireplace), inverter + battery on the stone wall.
 * First floor set back behind a terrace, wrapped in black louvres, under a
 * wide white flat roof fully covered by black frameless PV. Reflecting pool
 * in front on a stone deck.
 */
export default function HouseE() {
  const mullions = [-1.9, -1.2, -0.5, 0.2, 0.9, 1.6, 2.3, 3.0, 3.6]
  return (
    <group name="SMART_HOUSE_ROOT">
      <ZoneRing position={[0.2, 0.012, 0]} radius={4.8} color="#ffc857" group="solar" />
      {/* stone deck + pool */}
      <P geo="box" args={[8.4, 0.18, 5.6]} position={[0.2, 0.09, 0.2]} m={H('blackStone', { color: '#1a1f2a' })} />
      <P geo="box" args={[8.0, 0.02, 3.6]} position={[0.2, 0.19, -0.2]} m={H('white', { color: '#cfd5dd' })} />
      <group position={[1.4, 0.18, 2.35]}>
        <P geo="box" args={[3.8, 0.1, 1.2]} position={[0, 0.02, 0]} m={H('blackStone', { color: '#0c1017' })} />
        <P geo="box" args={[3.6, 0.02, 1.05]} position={[0, 0.08, 0]} m={H('water', { color: '#1b3a55', opacity: 0.85 })} shadow={false} />
      </group>
      {[-2.6, -1.4, 3.6].map((x) => (
        <P key={x} geo="icosahedron" args={[0.22, 1]} position={[x, 0.4, 2.5]} m={mat('base', 'foliage')} />
      ))}

      <group name="SMART_HOUSE">
        {/* ---- ground floor ---- */}
        <Interior />
        {/* black stone wall (left) with vertical joints */}
        <P geo="box" args={[1.8, 1.7, 3.5]} position={[-2.6, 1.05, 0]} m={H('blackStone')} />
        {[-3.3, -3.0, -2.7, -2.4, -2.1].map((x) => (
          <P key={x} geo="box" args={[0.02, 1.7, 0.02]} position={[x, 1.05, 1.76]} m={H('body', { color: '#05070c' })} shadow={false} />
        ))}
        {/* inverter + battery on the stone wall */}
        <group name="SOLAR_INVERTER" position={[-2.3, 1.15, 1.8]}>
          <P geo="box" args={[0.3, 0.3, 0.1]} position={[0.3, 0.2, 0]} m={mat('solar', 'white')} />
          <P geo="box" args={[0.3, 0.3, 0.1]} position={[-0.1, 0.2, 0]} m={mat('solar', 'white')} />
          <P geo="box" args={[0.3, 0.7, 0.14]} position={[0.3, -0.45, 0]} m={mat('solar', 'white')} />
          <Led position={[0.3, 0.22, 0.06]} color="#7cf5c2" size={0.015} group="solar" blink={2} />
          <Led position={[-0.1, 0.22, 0.06]} color="#35d6ff" size={0.015} group="solar" blink={3} />
          <Led position={[0.3, -0.2, 0.08]} color="#7cf5c2" size={0.015} group="solar" />
        </group>
        {/* back + side walls (glass at the front and right) */}
        <P geo="box" args={[2.2, 1.7, 0.1]} position={[-0.7, 1.05, -1.75]} m={H('white', { color: '#e3e7ec' })} />
        <P geo="box" args={[3.4, 1.7, 0.06]} position={[2.1, 1.05, -1.76]} m={H('glassTint', { color: '#8fc8ff', opacity: 0.18 })} shadow={false} />
        {[0.5, 1.2, 1.9, 2.6, 3.3].map((x) => (
          <P key={`b${x}`} geo="box" args={[0.06, 1.7, 0.1]} position={[x, 1.05, -1.76]} m={H('body', { color: '#05070c' })} />
        ))}
        {/* rear terrace + steps down to the backyard */}
        <P geo="box" args={[3.6, 0.06, 1.0]} position={[2.1, 0.22, -2.3]} m={H('white', { color: '#cfd5dd' })} />
        <Slats position={[0.2, 3.06, -1.95]} width={5.8} height={1.46} count={40} m={H('body', { color: '#0a0d14' })} thickness={0.03} />
        <P geo="box" args={[0.1, 1.7, 3.5]} position={[3.8, 1.05, 0]} m={H('glassTint', { color: '#8fc8ff', opacity: 0.25 })} shadow={false} />
        {/* front glazing + black mullions */}
        <P geo="box" args={[5.6, 1.7, 0.06]} position={[1.0, 1.05, 1.76]} m={H('glassTint', { color: '#8fc8ff', opacity: 0.18 })} shadow={false} />
        {mullions.map((x) => (
          <P key={x} geo="box" args={[0.06, 1.7, 0.1]} position={[x, 1.05, 1.76]} m={H('body', { color: '#05070c' })} />
        ))}
        <P geo="box" args={[5.7, 0.06, 0.1]} position={[1.0, 0.24, 1.76]} m={H('body', { color: '#05070c' })} />
        {/* first-floor slab: wide white band with LED soffit */}
        <P geo="box" args={[8.2, 0.42, 4.4]} position={[0.2, 2.1, 0.1]} m={H('white')} />
        <P geo="box" args={[8.0, 0.02, 0.04]} position={[0.2, 1.9, 2.28]} m={H('emissive', { color: '#ffe9c8', intensity: 1.8 })} shadow={false} />
        <P geo="box" args={[0.04, 0.02, 4.3]} position={[4.28, 1.9, 0.1]} m={H('emissive', { color: '#ffe9c8', intensity: 1.4 })} shadow={false} />
        {/* terrace railing (glass) */}
        <P geo="box" args={[6.0, 0.7, 0.03]} position={[0.2, 2.66, 2.1]} m={H('glassTint')} shadow={false} />
        {/* ---- first floor: set back, dark glass wrapped in louvres ---- */}
        <P geo="box" args={[6.0, 1.5, 2.9]} position={[0.2, 3.06, -0.5]} m={H('body', { color: '#0d1119' })} />
        <P geo="box" args={[5.2, 1.2, 2.2]} position={[0.2, 3.06, -0.5]} m={H('emissive', { color: '#ffb877', intensity: 0.35 })} shadow={false} />
        <P geo="box" args={[6.04, 1.5, 0.06]} position={[0.2, 3.06, 0.97]} m={H('glassTint', { color: '#5a7aa8', opacity: 0.35 })} shadow={false} />
        <Slats position={[0.2, 3.06, 1.05]} width={5.8} height={1.46} count={40} m={H('body', { color: '#0a0d14' })} thickness={0.03} />
        <Slats position={[3.25, 3.06, -0.5]} width={2.7} height={1.46} count={19} rotation={[0, Math.PI / 2, 0]} m={H('body', { color: '#0a0d14' })} thickness={0.03} />
        <Slats position={[-2.85, 3.06, -0.5]} width={2.7} height={1.46} count={19} rotation={[0, Math.PI / 2, 0]} m={H('body', { color: '#0a0d14' })} thickness={0.03} />
        {/* top roof: white slab, overhanging */}
        <P geo="box" args={[7.2, 0.4, 4.2]} position={[0.2, 4.0, -0.4]} m={H('white')} />
        <P geo="box" args={[7.0, 0.02, 0.04]} position={[0.2, 3.79, 1.68]} m={H('emissive', { color: '#dff4ff', intensity: 1.2 })} shadow={false} />
      </group>

      {/* SOLAR_PANELS — black frameless modules flush on the roof only */}
      <group name="SOLAR_PANELS" position={[0.2, 4.22, -0.4]}>
        {Array.from({ length: 6 }).map((_, i) =>
          Array.from({ length: 3 }).map((_, j) => (
            <group key={`${i}${j}`} position={[-2.75 + i * 1.1, 0, -1.2 + j * 1.2]}>
              <P geo="box" args={[1.06, 0.04, 1.16]} m={mat('solar', 'body', { color: '#0a0d14' })} />
              <P geo="box" args={[1.02, 0.012, 1.12]} position={[0, 0.024, 0]} m={mat('solar', 'solarBlack')} />
            </group>
          )),
        )}
      </group>

      <HitBox serviceId="solar" position={[0.2, 4.45, -0.4]} args={[7.0, 0.5, 4.0]} />
    </group>
  )
}
