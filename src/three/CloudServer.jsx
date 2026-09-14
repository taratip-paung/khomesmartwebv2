import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { P, Led, ZoneRing } from './Prim'
import { mat, geo } from './materials'
import HitBox from './HitBox'
import { intensity } from './highlight'

const VIOLET = '#a78bfa'
const CYAN = '#35d6ff'
export const CLOUD_ORIGIN = [6, 0, 3.5]

const CAB_W = 1.1
const CAB_H = 2.3
const CAB_D = 1.25

/* Faceted door: flat panel with a raised diagonal ridge (r0 → r1 → r2) so the
   surface breaks into angular planes; the light line runs along the ridge. */
const RIDGE = [
  [-0.14, CAB_H * 0.36, 0.24],
  [0.18, -0.02, 0.3],
  [-0.08, -CAB_H * 0.4, 0.2],
]
function facetGeometry() {
  const w = CAB_W - 0.08
  const h = CAB_H - 0.12
  const c0 = [-w / 2, -h / 2, 0]
  const c1 = [w / 2, -h / 2, 0]
  const c2 = [w / 2, h / 2, 0]
  const c3 = [-w / 2, h / 2, 0]
  const mL = [-w / 2, 0.1, 0]
  const mR = [w / 2, 0.25, 0]
  const [r0, r1, r2] = RIDGE
  const tris = [
    [c3, r0, mL], [mL, r0, r1], [mL, r1, r2], [mL, r2, c0], // left of the ridge
    [c3, c2, r0], [c2, mR, r0], [mR, r1, r0], [mR, c1, r1], [c1, r2, r1], [c1, c0, r2], // right
  ]
  const pos = new Float32Array(tris.flat(2))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}

/** Glowing chevron along the ridge with a breathing glow + a travelling pulse */
function LightLine({ phase = 0 }) {
  const lineMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#000', emissive: CYAN, emissiveIntensity: 3, toneMapped: false }),
    [],
  )
  const pulse = useRef()
  const path = useMemo(() => {
    const pts = RIDGE.map(([x, y, z]) => new THREE.Vector3(x, y, z + 0.012))
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0)
  }, [])
  const segs = useMemo(() => {
    const out = []
    for (let i = 0; i < RIDGE.length - 1; i++) {
      const a = new THREE.Vector3(...RIDGE[i]).setZ(RIDGE[i][2] + 0.012)
      const b = new THREE.Vector3(...RIDGE[i + 1]).setZ(RIDGE[i + 1][2] + 0.012)
      const dir = b.clone().sub(a)
      const len = dir.length()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
      out.push({ pos: a.clone().add(b).multiplyScalar(0.5), q, len })
    }
    return out
  }, [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const k = intensity('cloud')
    lineMat.emissiveIntensity = (2.2 + Math.sin(t * 1.6 + phase) * 0.9) * k
    if (pulse.current) {
      const u = ((t * 0.35 + phase * 0.13) % 1)
      path.getPoint(u, tmp)
      pulse.current.position.copy(tmp)
      pulse.current.material.emissiveIntensity = 6 * k * Math.sin(u * Math.PI)
    }
  })
  return (
    <group>
      {segs.map((s, i) => (
        <mesh key={i} position={s.pos} quaternion={s.q} scale={[1, s.len, 1]} geometry={geo('cylinder', [0.012, 0.012, 1, 6])} material={lineMat} raycast={() => null} />
      ))}
      <mesh ref={pulse} geometry={geo('sphere', [0.03, 8, 8])} raycast={() => null}>
        <meshStandardMaterial color="#000" emissive="#dffbff" emissiveIntensity={6} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Modern mainframe-style cabinet: graphite body, ribbed sides, faceted lit door */
function Cabinet({ name, position, phase = 0, grille = false }) {
  const facet = useMemo(() => facetGeometry(), [])
  return (
    <group name={name} position={position}>
      {/* body + plinth + cap */}
      <P geo="box" args={[CAB_W, CAB_H, CAB_D]} position={[0, CAB_H / 2, 0]} m={mat('cloud', 'graphiteBody')} />
      <P geo="box" args={[CAB_W - 0.06, 0.08, CAB_D - 0.06]} position={[0, 0.04, 0]} m={mat('cloud', 'body', { color: '#090c12' })} />
      <P geo="box" args={[CAB_W + 0.02, 0.04, CAB_D + 0.02]} position={[0, CAB_H + 0.02, 0]} m={mat('cloud', 'graphiteBody')} />
      {/* ribbed side panels */}
      {[-1, 1].map((sx) =>
        [-0.45, -0.15, 0.15, 0.45].map((z) => (
          <P key={`${sx}${z}`} geo="box" args={[0.02, CAB_H - 0.2, 0.06]} position={[(sx * CAB_W) / 2, CAB_H / 2, z]} m={mat('cloud', 'body', { color: '#0b0f17' })} shadow={false} />
        )),
      )}
      {/* rear service door with handle recess */}
      <P geo="box" args={[0.05, 0.5, 0.03]} position={[0, CAB_H * 0.55, -CAB_D / 2 - 0.01]} m={mat('cloud', 'body', { color: '#05070c' })} shadow={false} />
      {grille ? (
        <>
          <P geo="box" args={[CAB_W - 0.1, CAB_H - 0.14, 0.06]} position={[0, CAB_H / 2, CAB_D / 2 + 0.03]} m={mat('cloud', 'graphiteBody')} />
          {[0.36, 1.15, 1.94].map((y) => (
            <P key={y} geo="box" args={[CAB_W - 0.24, 0.66, 0.02]} position={[0, y, CAB_D / 2 + 0.07]} m={mat('cloud', 'grille')} shadow={false} />
          ))}
          <Led position={[0.35, CAB_H - 0.1, CAB_D / 2 + 0.08]} color="#7cf5c2" size={0.015} group="cloud" blink={2.2} />
        </>
      ) : (
        <group position={[0, CAB_H / 2, CAB_D / 2 + 0.02]}>
          {/* door slab + faceted face */}
          <P geo="box" args={[CAB_W - 0.08, CAB_H - 0.12, 0.05]} position={[0, 0, 0.02]} m={mat('cloud', 'graphiteBody')} />
          <mesh geometry={facet} material={mat('cloud', 'graphite')} position={[0, 0, 0.045]} castShadow receiveShadow />
          <group position={[0, 0, 0.045]}>
            <LightLine phase={phase} />
          </group>
          {/* small status LEDs at the top of the door */}
          <Led position={[0.38, CAB_H / 2 - 0.16, 0.2]} color="#7cf5c2" size={0.012} group="cloud" blink={3 + phase} />
          <Led position={[0.42, CAB_H / 2 - 0.16, 0.2]} color={CYAN} size={0.012} group="cloud" blink={5 + phase} />
        </group>
      )}
    </group>
  )
}

/**
 * CLOUD_SERVER_RACK ×4 — a row of modern mainframe-style cabinets on a raised
 * floor with underglow. Faceted doors carry an animated light chevron. Group "cloud".
 */
export default function CloudServer() {
  const pitch = CAB_W + 0.12
  return (
    <group name="CLOUD_ROOT" position={CLOUD_ORIGIN} scale={0.8}>
      <ZoneRing position={[0, 0.012, 0]} radius={3.0} color={VIOLET} group="cloud" />
      {/* raised floor + underglow */}
      <P geo="box" args={[5.4, 0.16, 2.6]} position={[0, 0.08, 0]} m={mat('cloud', 'concrete', { color: '#1c222e' })} />
      <P geo="box" args={[5.2, 0.02, 2.4]} position={[0, 0.17, 0]} m={mat('cloud', 'body', { color: '#0d1119' })} />
      <P geo="box" args={[5.42, 0.02, 0.03]} position={[0, 0.17, 1.31]} m={mat('cloud', 'emissive', { color: VIOLET, intensity: 2 })} shadow={false} />
      <P geo="box" args={[0.03, 0.02, 2.62]} position={[2.71, 0.17, 0]} m={mat('cloud', 'emissive', { color: VIOLET, intensity: 1.6 })} shadow={false} />
      {/* cabinets */}
      <Cabinet name="CLOUD_SERVER_RACK" position={[-1.5 * pitch, 0.18, 0]} phase={0} />
      <Cabinet name="CLOUD_SERVER_RACK_02" position={[-0.5 * pitch, 0.18, 0]} phase={2.1} />
      <Cabinet name="CLOUD_SERVER_RACK_03" position={[0.5 * pitch, 0.18, 0]} phase={4.2} />
      <Cabinet name="CLOUD_SERVER_RACK_04" position={[1.5 * pitch, 0.18, 0]} grille />
      {/* overhead cable tray */}
      <P geo="box" args={[5.0, 0.06, 0.3]} position={[0, CAB_H + 0.55, -0.3]} m={mat('cloud', 'darkMetal')} />
      {[-2.3, 2.3].map((x) => (
        <P key={x} geo="box" args={[0.04, 0.35, 0.04]} position={[x, CAB_H + 0.38, -0.3]} m={mat('cloud', 'darkMetal')} />
      ))}
      <HitBox serviceId="cloud" position={[0, 1.4, 0]} args={[5.4, 3.0, 2.6]} />
    </group>
  )
}
