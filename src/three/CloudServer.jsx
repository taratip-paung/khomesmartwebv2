import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { P, Led, ZoneRing } from './Prim'
import { mat } from './materials'
import HitBox from './HitBox'

const VIOLET = '#a78bfa'
export const CLOUD_ORIGIN = [6, 0, 3.5]

/** 42U rack: dark frame, unit faces, LED columns, tinted glass door */
function Rack({ name, position }) {
  const units = [0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7]
  return (
    <group name={name} position={position}>
      <P geo="box" args={[0.6, 1.95, 0.9]} position={[0, 0.975, 0]} m={mat('cloud', 'body', { color: '#0d1220' })} />
      {units.map((y, i) => (
        <group key={y}>
          <P geo="box" args={[0.52, 0.16, 0.02]} position={[0, y, 0.44]} m={mat('cloud', 'darkMetal', { color: i % 3 === 0 ? '#2a3140' : '#1c2230' })} shadow={false} />
          <Led position={[-0.2, y + 0.03, 0.46]} color="#7cf5c2" size={0.012} group="cloud" blink={2.5 + i * 0.7} />
          <Led position={[-0.16, y + 0.03, 0.46]} color={VIOLET} size={0.012} group="cloud" blink={4 + i * 1.3} />
          <Led position={[-0.12, y + 0.03, 0.46]} color="#35d6ff" size={0.012} group="cloud" blink={i % 2 ? 6 : 0} />
        </group>
      ))}
      <P geo="box" args={[0.58, 1.9, 0.02]} position={[0, 0.975, 0.47]} m={mat('cloud', 'glassTint', { color: '#b8a6ff' })} shadow={false} />
    </group>
  )
}

/**
 * CLOUD_SERVER_RACK ×3 inside a glass-walled edge data-centre module with
 * rooftop cooling units; CLOUD_CORE — a floating glass sphere with a glowing
 * core and orbit rings, tethered to the module by a light beam. Group "cloud".
 */
export default function CloudServer() {
  const core = useRef()
  const inner = useRef()
  const ringA = useRef()
  const ringB = useRef()
  const fans = useRef([])
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    if (core.current) core.current.position.y = 4.1 + Math.sin(t * 1.1) * 0.12
    if (inner.current) {
      inner.current.rotation.y += dt * 0.5
      inner.current.rotation.x = Math.sin(t * 0.6) * 0.3
    }
    if (ringA.current) ringA.current.rotation.z += dt * 0.4
    if (ringB.current) ringB.current.rotation.x += dt * 0.3
    fans.current.forEach((f) => f && (f.rotation.y += dt * 9))
  })
  const W = 3.4
  const D = 2.2
  const H = 2.3
  return (
    <group name="CLOUD_ROOT" position={CLOUD_ORIGIN}>
      <ZoneRing position={[0, 0.012, 0]} radius={2.9} color={VIOLET} group="cloud" />
      {/* module base + floor */}
      <P geo="box" args={[W + 0.4, 0.18, D + 0.4]} position={[0, 0.09, 0]} m={mat('cloud', 'concrete')} />
      <P geo="box" args={[W, 0.04, D]} position={[0, 0.2, 0]} m={mat('cloud', 'body', { color: '#1a2030' })} />
      {/* racks */}
      <Rack name="CLOUD_SERVER_RACK" position={[-0.95, 0.22, -0.2]} />
      <Rack name="CLOUD_SERVER_RACK_02" position={[0, 0.22, -0.2]} />
      <Rack name="CLOUD_SERVER_RACK_03" position={[0.95, 0.22, -0.2]} />
      {/* glass envelope with metal frame */}
      <P geo="box" args={[W, H, D]} position={[0, 0.22 + H / 2, 0]} m={mat('cloud', 'glassTint', { color: '#9fd8ff', opacity: 0.18 })} shadow={false} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <P key={`${sx}${sz}`} geo="box" args={[0.08, H, 0.08]} position={[(sx * W) / 2, 0.22 + H / 2, (sz * D) / 2]} m={mat('cloud', 'darkMetal')} />
        )),
      )}
      {/* roof slab + LED edge + cooling units */}
      <P geo="box" args={[W + 0.2, 0.12, D + 0.2]} position={[0, 0.22 + H + 0.06, 0]} m={mat('cloud', 'white', { color: '#cfd7e1' })} />
      <P geo="box" args={[W + 0.22, 0.02, 0.03]} position={[0, 0.22 + H + 0.13, D / 2 + 0.1]} m={mat('cloud', 'emissive', { color: VIOLET, intensity: 2.2 })} shadow={false} />
      {[-1, 0, 1].map((i) => (
        <group key={i} position={[i * 1.0, 0.22 + H + 0.12, 0]}>
          <P geo="box" args={[0.7, 0.35, 0.7]} position={[0, 0.18, 0]} m={mat('cloud', 'white', { color: '#b8c2cf' })} />
          <P geo="cylinder" args={[0.28, 0.28, 0.02, 24]} position={[0, 0.37, 0]} m={mat('cloud', 'darkMetal')} />
          <group ref={(el) => (fans.current[i + 1] = el)} position={[0, 0.39, 0]}>
            {[0, 1, 2, 3].map((b) => (
              <P key={b} geo="box" args={[0.24, 0.01, 0.06]} position={[0.12, 0, 0]} rotation={[0, (b * Math.PI) / 2, 0]} m={mat('cloud', 'metal')} shadow={false} />
            ))}
          </group>
        </group>
      ))}
      {/* uplink beam + floating core */}
      <P geo="cylinder" args={[0.03, 0.09, 1.3, 12, 1, true]} position={[0, 3.35, 0]} m={mat('cloud', 'emissive', { color: VIOLET, intensity: 1.2, opacity: 0.35 })} shadow={false} />
      <group ref={core} name="CLOUD_CORE" position={[0, 4.1, 0]}>
        <P geo="sphere" args={[0.72, 48, 32]} m={mat('cloud', 'glass')} shadow={false} />
        <group ref={inner}>
          <P geo="icosahedron" args={[0.36, 1]} m={mat('cloud', 'emissive', { color: VIOLET, intensity: 1.5 })} shadow={false} />
          <P geo="icosahedron" args={[0.42, 1]} m={mat('cloud', 'glassTint', { color: '#d9ccff', opacity: 0.35 })} shadow={false} />
        </group>
        <group ref={ringA} rotation={[Math.PI / 2.3, 0, 0]}>
          <P geo="torus" args={[1.0, 0.018, 8, 80]} m={mat('cloud', 'emissive', { color: VIOLET, intensity: 1.3 })} shadow={false} />
        </group>
        <group ref={ringB} rotation={[0.3, 0.5, 0]}>
          <P geo="torus" args={[1.15, 0.012, 8, 80]} m={mat('cloud', 'emissive', { color: '#35d6ff', intensity: 1.6 })} shadow={false} />
        </group>
      </group>

      <HitBox serviceId="cloud" position={[0, 2.4, 0]} args={[4, 5.4, 3]} />
    </group>
  )
}
