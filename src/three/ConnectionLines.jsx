import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { intensity } from './highlight'
import { RND_ORIGIN } from './SensorSystem'
import { NETWORK_ORIGIN } from './NetworkSystem'
import { CLOUD_ORIGIN } from './CloudServer'

const HUB = new THREE.Vector3(-0.6, 3.5, -0.2) // house roof — ecosystem hub

/**
 * CONNECTION_SOLAR / RND / NETWORK / CLOUD — glowing bezier links from the
 * house to each service zone, with data pulses travelling along them.
 */
const links = [
  { id: 'solar', name: 'CONNECTION_SOLAR', to: [1.55, 2.2, 0.05], color: '#ffc857', lift: 0.9, pulses: 2 },
  { id: 'rnd', name: 'CONNECTION_RND', to: [RND_ORIGIN[0], 3.4, RND_ORIGIN[2]], color: '#7cf5c2', lift: 2.2, pulses: 3 },
  { id: 'network', name: 'CONNECTION_NETWORK', to: [NETWORK_ORIGIN[0], 5.6, NETWORK_ORIGIN[2]], color: '#35d6ff', lift: 2.6, pulses: 3 },
  { id: 'cloud', name: 'CONNECTION_CLOUD', to: [CLOUD_ORIGIN[0], 4.1, CLOUD_ORIGIN[2]], color: '#a78bfa', lift: 2.4, pulses: 3 },
]

function Link({ link, pulseCount }) {
  const curve = useMemo(() => {
    const to = new THREE.Vector3(...link.to)
    const mid = HUB.clone().lerp(to, 0.5)
    mid.y += link.lift
    return new THREE.QuadraticBezierCurve3(HUB.clone(), mid, to)
  }, [link])
  const points = useMemo(() => curve.getPoints(40), [curve])
  const lineRef = useRef()
  const pulses = useRef([])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const k = intensity(link.id)
    if (lineRef.current) lineRef.current.material.opacity = Math.min(1, 0.45 * k)
    pulses.current.forEach((m, i) => {
      if (!m) return
      const t = (clock.elapsedTime * 0.28 + i / pulseCount) % 1
      curve.getPoint(t, tmp)
      m.position.copy(tmp)
      m.material.opacity = Math.min(1, k * 0.9 * Math.sin(t * Math.PI))
    })
  })

  return (
    <group name={link.name}>
      <Line ref={lineRef} points={points} color={link.color} lineWidth={1.4} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      {Array.from({ length: pulseCount }).map((_, i) => (
        <mesh key={i} ref={(el) => (pulses.current[i] = el)} raycast={() => null}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshBasicMaterial color={link.color} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

export default function ConnectionLines({ lite = false }) {
  return (
    <group name="CONNECTIONS">
      {links.map((l) => (
        <Link key={l.id} link={l} pulseCount={lite ? 1 : l.pulses} />
      ))}
    </group>
  )
}
