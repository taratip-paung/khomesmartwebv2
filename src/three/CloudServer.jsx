import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Holo, { Dot } from './Holo'
import HitBox from './HitBox'

const VIOLET = '#a78bfa'
export const CLOUD_ORIGIN = [5, 0, 3.5]

function Rack({ name, position }) {
  return (
    <group name={name} position={position}>
      <Holo geo="box" args={[0.9, 2.0, 0.8]} position={[0, 1.0, 0]} group="cloud" color={VIOLET} faceOpacity={0.08} />
      {/* shelves */}
      {[0.35, 0.7, 1.05, 1.4, 1.75].map((y) => (
        <Holo key={y} geo="plane" args={[0.8, 0.22]} position={[0, y, 0.41]} group="cloud" color={VIOLET} faceOpacity={0.04} edgeOpacity={0.45} />
      ))}
      {/* status LEDs */}
      {[0.35, 0.7, 1.05, 1.4, 1.75].map((y, i) => (
        <group key={y}>
          <Dot position={[-0.28, y, 0.43]} color="#7cf5c2" size={0.025} group="cloud" blink={3 + i} />
          <Dot position={[-0.2, y, 0.43]} color={VIOLET} size={0.025} group="cloud" blink={5 + i * 1.3} />
        </group>
      ))}
    </group>
  )
}

/** CLOUD_SERVER_RACK ×2 + CLOUD_CORE (floating) */
export default function CloudServer() {
  const core = useRef()
  const halo = useRef()
  useFrame(({ clock }, dt) => {
    if (core.current) {
      core.current.rotation.y += dt * 0.35
      core.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.2
      core.current.position.y = 3.9 + Math.sin(clock.elapsedTime * 1.1) * 0.12
    }
    if (halo.current) halo.current.rotation.z += dt * 0.5
  })
  return (
    <group name="CLOUD_ROOT" position={CLOUD_ORIGIN}>
      <Rack name="CLOUD_SERVER_RACK" position={[-0.55, 0, 0]} />
      <Rack name="CLOUD_SERVER_RACK_02" position={[0.55, 0, 0]} />
      <Holo geo="box" args={[2.4, 0.08, 1.4]} position={[0, 0.04, 0]} group="cloud" color={VIOLET} faceOpacity={0.06} />
      {/* floating cloud core */}
      <group ref={core} name="CLOUD_CORE" position={[0, 3.9, 0]}>
        <Holo geo="icosahedron" args={[0.62, 1]} group="cloud" color={VIOLET} faceOpacity={0.16} pulse={0.2} />
        <Holo geo="icosahedron" args={[0.3, 0]} group="cloud" color="#ffffff" faceOpacity={0.25} edgeOpacity={0.9} />
      </group>
      <group ref={halo} position={[0, 3.9, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
        <Holo geo="torus" args={[1.05, 0.012, 6, 64]} group="cloud" color={VIOLET} faceOpacity={0.3} edgeOpacity={0} />
      </group>
      {/* uplink beam rack → core */}
      <Holo geo="cylinder" args={[0.02, 0.06, 1.5, 6, 1, true]} position={[0, 2.85, 0]} group="cloud" color={VIOLET} faceOpacity={0.12} edgeOpacity={0.3} />
      <HitBox serviceId="cloud" position={[0, 2.3, 0]} args={[3.2, 5.2, 2.6]} />
    </group>
  )
}
