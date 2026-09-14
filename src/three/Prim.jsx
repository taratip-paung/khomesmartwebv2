import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { geo } from './materials'
import { intensity } from './highlight'

/** Basic PBR primitive: shared geometry + shared material, shadows on by default. */
export function P({ geo: kind = 'box', args = [1, 1, 1], m, shadow = true, receive = true, name, children, ...props }) {
  const geometry = useMemo(() => geo(kind, args), [kind, args])
  return (
    <mesh geometry={geometry} material={m} castShadow={shadow} receiveShadow={receive} name={name} {...props}>
      {children}
    </mesh>
  )
}

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)

/** Thin cylinder between two world points — lattice towers, railings, cables. */
export function Strut({ from, to, r = 0.03, m, segments = 6 }) {
  const { position, quaternion, length } = useMemo(() => {
    _a.set(...from)
    _b.set(...to)
    const dir = _b.clone().sub(_a)
    const length = dir.length()
    const position = _a.clone().add(dir.clone().multiplyScalar(0.5))
    const quaternion = new THREE.Quaternion().setFromUnitVectors(_up, dir.normalize())
    return { position, quaternion, length }
  }, [from, to])
  const geometry = useMemo(() => geo('cylinder', [r, r, 1, segments]), [r, segments])
  return <mesh geometry={geometry} material={m} position={position} quaternion={quaternion} scale={[1, length, 1]} castShadow />
}

/**
 * Small status LED. Blinks (if `blink` > 0) and follows the group's highlight
 * intensity. Uses its own material because each LED has its own phase.
 */
export function Led({ position, color = '#35d6ff', size = 0.03, group = 'base', blink = 0, intensity: base = 3 }) {
  const ref = useRef()
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#000', emissive: color, emissiveIntensity: base, toneMapped: false }),
    [color, base],
  )
  useFrame(({ clock }) => {
    const k = intensity(group)
    const phase = position[0] * 7.1 + position[1] * 3.3 + position[2] * 5.7
    const b = blink ? (Math.sin(clock.elapsedTime * blink + phase) > 0.1 ? 1 : 0.08) : 1
    material.emissiveIntensity = base * k * b
  })
  return <mesh ref={ref} position={position} geometry={geo('sphere', [size, 8, 8])} material={material} raycast={() => null} />
}

/** Glowing ground ring under a service zone — brightens when that zone is selected. */
export function ZoneRing({ position, radius = 2.4, color = '#35d6ff', group }) {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#000', emissive: color, emissiveIntensity: 0.6, toneMapped: false, transparent: true, opacity: 0.9 }),
    [color],
  )
  useFrame(({ clock }) => {
    const k = intensity(group)
    const pulse = k > 1.2 ? 1 + Math.sin(clock.elapsedTime * 2.5) * 0.25 : 1
    material.emissiveIntensity = (k > 1.2 ? 2.4 : 0.5 * k) * pulse
  })
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} geometry={geo('ring', [radius - 0.04, radius, 64])} material={material} raycast={() => null} receiveShadow={false} />
  )
}
