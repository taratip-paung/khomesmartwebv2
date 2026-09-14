import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { intensity } from './highlight'

const geometryFactories = {
  box: (a) => new THREE.BoxGeometry(...a),
  cylinder: (a) => new THREE.CylinderGeometry(...a),
  cone: (a) => new THREE.ConeGeometry(...a),
  sphere: (a) => new THREE.SphereGeometry(...a),
  icosahedron: (a) => new THREE.IcosahedronGeometry(...a),
  octahedron: (a) => new THREE.OctahedronGeometry(...a),
  torus: (a) => new THREE.TorusGeometry(...a),
  plane: (a) => new THREE.PlaneGeometry(...a),
  ring: (a) => new THREE.RingGeometry(...a),
}

/**
 * Hologram primitive: translucent additive faces + glowing edge lines.
 * `group` ties it to the highlight system; `name` follows the Blender naming
 * convention (plan §17) so a future GLB can replace this 1:1.
 */
export default function Holo({
  geo = 'box',
  args = [1, 1, 1],
  color = '#35d6ff',
  group = 'base',
  name,
  faceOpacity = 0.07,
  edgeOpacity = 0.85,
  edgeThreshold = 20,
  pulse = 0,
  children,
  ...props
}) {
  const geometry = useMemo(() => geometryFactories[geo](args), [geo, args])
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, edgeThreshold), [geometry, edgeThreshold])
  const faceMat = useRef()
  const edgeMat = useRef()

  useFrame(({ clock }) => {
    const k = intensity(group)
    const p = pulse ? 1 + Math.sin(clock.elapsedTime * 2.2) * pulse * (k > 1.2 ? 1 : 0.4) : 1
    if (faceMat.current) faceMat.current.opacity = Math.min(0.5, faceOpacity * k * p)
    if (edgeMat.current) edgeMat.current.opacity = Math.min(1, edgeOpacity * k * p)
  })

  return (
    <group name={name} {...props}>
      <mesh geometry={geometry} raycast={() => null}>
        <meshBasicMaterial
          ref={faceMat}
          color={color}
          transparent
          opacity={faceOpacity}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <lineSegments geometry={edges} raycast={() => null}>
        <lineBasicMaterial ref={edgeMat} color={color} transparent opacity={edgeOpacity} depthWrite={false} />
      </lineSegments>
      {children}
    </group>
  )
}

/** Small glowing point (sprite-less, cheap) — for indicator lights */
export function Dot({ position, color = '#35d6ff', size = 0.09, group = 'base', blink = 0 }) {
  const mat = useRef()
  useFrame(({ clock }) => {
    if (!mat.current) return
    const k = intensity(group)
    const b = blink ? (Math.sin(clock.elapsedTime * blink + position[0] * 7 + position[2] * 3) > 0.2 ? 1 : 0.15) : 1
    mat.current.opacity = Math.min(1, 0.9 * k * b)
  })
  return (
    <mesh position={position} raycast={() => null}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial ref={mat} color={color} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}
