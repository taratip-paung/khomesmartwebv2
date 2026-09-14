import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { P, Strut, Led, ZoneRing } from './Prim'
import { mat, geo } from './materials'
import HitBox from './HitBox'
import { intensity } from './highlight'

const CYAN = '#35d6ff'
export const NETWORK_ORIGIN = [5.5, 0, -4]

/** Expanding signal rings emitted from the antenna tip */
function SignalWaves({ position }) {
  const refs = useRef([])
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#000', emissive: CYAN, emissiveIntensity: 2, toneMapped: false, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
    [],
  )
  const mats = useMemo(() => [material, material.clone(), material.clone()], [material])
  useFrame(({ clock }) => {
    const k = intensity('network')
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = (clock.elapsedTime * 0.4 + i / 3) % 1
      m.scale.setScalar(0.25 + t * 2.4)
      mats[i].opacity = (1 - t) * 0.6 * k
      mats[i].emissiveIntensity = 2 * k
    })
  })
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} rotation={[Math.PI / 2, 0, 0]} geometry={geo('ring', [0.96, 1, 48])} material={mats[i]} raycast={() => null} />
      ))}
    </group>
  )
}

/** Self-supporting lattice tower: 4 tapered legs, horizontal + diagonal bracing */
function LatticeTower({ height = 6.4, baseHalf = 0.75, topHalf = 0.22, levels = 6 }) {
  const m = mat('network', 'metal')
  const corners = (h) => {
    const s = baseHalf + (topHalf - baseHalf) * (h / height)
    return [
      [-s, h, -s],
      [s, h, -s],
      [s, h, s],
      [-s, h, s],
    ]
  }
  const struts = useMemo(() => {
    const out = []
    const base = corners(0)
    const top = corners(height)
    for (let i = 0; i < 4; i++) out.push({ from: base[i], to: top[i], r: 0.04 })
    for (let l = 1; l <= levels; l++) {
      const h = (l * height) / levels
      const c = corners(h)
      const cPrev = corners(((l - 1) * height) / levels)
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4
        out.push({ from: c[i], to: c[j], r: 0.02 })
        out.push({ from: cPrev[i], to: c[j], r: 0.014 }) // diagonal
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, baseHalf, topHalf, levels])
  return (
    <group name="NETWORK_TOWER">
      {struts.map((s, i) => (
        <Strut key={i} from={s.from} to={s.to} r={s.r} m={m} />
      ))}
    </group>
  )
}

/**
 * NETWORK_TOWER (lattice) with sector antennas + microwave dish,
 * NETWORK_ROUTER cabinet and FIBER_NODE pedestal at the base. Group "network".
 */
export default function NetworkSystem() {
  const H = 5.4
  return (
    <group name="NETWORK_ROOT" position={NETWORK_ORIGIN}>
      <ZoneRing position={[0, 0.012, 0]} radius={2.8} color={CYAN} group="network" />
      {/* foundation */}
      <P geo="box" args={[2.4, 0.2, 2.4]} position={[0, 0.1, 0]} m={mat('network', 'concrete')} />
      {[-0.75, 0.75].map((x) =>
        [-0.75, 0.75].map((z) => <P key={`${x}${z}`} geo="box" args={[0.3, 0.2, 0.3]} position={[x, 0.3, z]} m={mat('network', 'concrete')} />),
      )}

      <group position={[0, 0.4, 0]}>
        <LatticeTower height={H} />
        {/* top platform + railing */}
        <P geo="box" args={[0.9, 0.05, 0.9]} position={[0, H, 0]} m={mat('network', 'darkMetal')} />
        {/* sector antenna panels (3) */}
        {[0, 1, 2].map((i) => {
          const a = (i * Math.PI * 2) / 3
          return (
            <group key={i} rotation={[0, a, 0]} position={[0, H - 0.3, 0]}>
              <P geo="box" args={[0.03, 0.4, 0.03]} position={[0.45, 0, 0]} m={mat('network', 'metal')} />
              <P geo="box" args={[0.12, 1.0, 0.28]} position={[0.62, 0, 0]} rotation={[0, 0, -0.06]} m={mat('network', 'white')} />
            </group>
          )
        })}
        {/* microwave dish */}
        <group position={[0, H - 1.6, 0.45]} rotation={[0.25, 0, 0]}>
          <P geo="cylinder" args={[0.42, 0.36, 0.12, 24]} rotation={[Math.PI / 2, 0, 0]} m={mat('network', 'white')} />
          <P geo="cylinder" args={[0.02, 0.02, 0.4, 6]} position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]} m={mat('network', 'metal')} />
          <P geo="box" args={[0.08, 0.08, 0.08]} position={[0, 0, 0.45]} m={mat('network', 'darkMetal')} />
        </group>
        {/* mast, aviation light, waves */}
        <P geo="cylinder" args={[0.025, 0.03, 1.6, 8]} position={[0, H + 0.8, 0]} m={mat('network', 'metal')} />
        <Led position={[0, H + 1.65, 0]} color="#ff4d4d" size={0.06} group="network" blink={1.6} intensity={4} />
        <SignalWaves position={[0, H + 1.3, 0]} />
      </group>

      {/* NETWORK_ROUTER — outdoor equipment cabinet */}
      <group name="NETWORK_ROUTER" position={[1.7, 0, 0.9]} rotation={[0, -0.3, 0]}>
        <P geo="box" args={[0.9, 1.1, 0.6]} position={[0, 0.55, 0]} m={mat('network', 'white', { color: '#c7d0da' })} />
        <P geo="box" args={[0.8, 0.9, 0.02]} position={[0, 0.58, 0.31]} m={mat('network', 'body')} />
        <P geo="box" args={[0.6, 0.06, 0.02]} position={[0, 0.9, 0.32]} m={mat('network', 'darkMetal')} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Led key={i} position={[-0.25 + i * 0.12, 0.9, 0.335]} color={CYAN} size={0.016} group="network" blink={3 + i * 1.1} />
        ))}
        <Led position={[0.3, 0.75, 0.335]} color="#7cf5c2" size={0.016} group="network" />
      </group>
      {/* FIBER_NODE — fibre pedestal */}
      <group name="FIBER_NODE" position={[-1.5, 0, 1.3]}>
        <P geo="box" args={[0.36, 0.7, 0.28]} position={[0, 0.35, 0]} m={mat('network', 'white', { color: '#b9c3ce' })} />
        <P geo="box" args={[0.3, 0.05, 0.02]} position={[0, 0.55, 0.15]} m={mat('network', 'emissive', { color: '#ffc857', intensity: 1.4 })} shadow={false} />
      </group>

      <HitBox serviceId="network" position={[0, 4.2, 0.2]} args={[3.4, 9, 3.2]} />
    </group>
  )
}
