import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Holo, { Dot } from './Holo'
import HitBox from './HitBox'
import { intensity } from './highlight'

const CYAN = '#35d6ff'
export const NETWORK_ORIGIN = [5, 0, -3]

/** Expanding signal rings emitted from the antenna tip */
function SignalWaves({ position }) {
  const refs = useRef([])
  useFrame(({ clock }) => {
    const k = intensity('network')
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = ((clock.elapsedTime * 0.45 + i / 3) % 1)
      m.scale.setScalar(0.3 + t * 2.2)
      m.material.opacity = (1 - t) * 0.5 * k
    })
  })
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.95, 1, 48]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  )
}

/** NETWORK_TOWER + NETWORK_ROUTER + FIBER_NODE */
export default function NetworkSystem() {
  const levels = [1.4, 2.8, 4.2, 5.6]
  return (
    <group name="NETWORK_ROOT" position={NETWORK_ORIGIN} scale={0.85}>
      {/* lattice tower: tapered 4-sided frustum + horizontal brace frames */}
      <Holo name="NETWORK_TOWER" geo="cylinder" args={[0.22, 0.9, 6.4, 4, 1, true]} position={[0, 3.2, 0]} rotation={[0, Math.PI / 4, 0]} group="network" color={CYAN} faceOpacity={0.05} edgeOpacity={0.9} edgeThreshold={1} />
      {levels.map((y, i) => {
        const w = (0.9 - (0.68 * y) / 6.4) * 2 * 0.72
        return <Holo key={y} geo="box" args={[w, 0.03, w]} position={[0, y, 0]} group="network" color={CYAN} faceOpacity={0.05} edgeOpacity={0.7} />
      })}
      {/* antenna mast + dishes */}
      <Holo geo="cylinder" args={[0.025, 0.025, 1.6, 4]} position={[0, 7.1, 0]} group="network" faceOpacity={0.05} />
      <Holo geo="cone" args={[0.35, 0.2, 12, 1, true]} position={[0.4, 5.9, 0]} rotation={[0, 0, -Math.PI / 2]} group="network" faceOpacity={0.12} edgeThreshold={30} />
      <Holo geo="cone" args={[0.35, 0.2, 12, 1, true]} position={[-0.3, 5.2, 0.3]} rotation={[Math.PI / 2, 0, Math.PI / 4]} group="network" faceOpacity={0.12} edgeThreshold={30} />
      <Dot position={[0, 7.95, 0]} color="#ff6b6b" size={0.05} group="network" blink={1.5} />
      <SignalWaves position={[0, 7.4, 0]} />
      {/* ground equipment */}
      <group name="NETWORK_ROUTER" position={[1.3, 0, 0.9]}>
        <Holo geo="box" args={[1.0, 0.55, 0.7]} position={[0, 0.28, 0]} group="network" color={CYAN} faceOpacity={0.1} />
        {[0, 1, 2, 3].map((i) => (
          <Dot key={i} position={[-0.32 + i * 0.2, 0.42, 0.36]} color={CYAN} size={0.03} group="network" blink={4 + i} />
        ))}
      </group>
      <Holo name="FIBER_NODE" geo="cylinder" args={[0.22, 0.22, 0.7, 8]} position={[-1.2, 0.35, 1.2]} group="network" color={CYAN} faceOpacity={0.1}>
        <Dot position={[0, 0.42, 0]} color={CYAN} size={0.04} group="network" blink={2} />
      </Holo>
      <HitBox serviceId="network" position={[0, 3.4, 0.2]} args={[3.6, 8.2, 3.4]} />
    </group>
  )
}
