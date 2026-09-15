import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * น้องบี — Be Connected mascot. Low-poly hexagonal bee, standing pose.
 * Every part is a 6-sided CylinderGeometry so it stays consistent with the
 * honeycomb / solar-cell language of the brand. Procedural (no GLB) on purpose:
 * swap for a Blender GLB later by replacing this file only.
 *
 * DNA that must survive any restyle:
 *  - hex solar-cell wings (7 cells each), not insect veins
 *  - cyan energy seam behind the front rim (pulses = clean energy inside)
 *  - antennae with hex LED tips (IoT / connected)
 */

const FLAT = Math.PI / 6 // rotate hex so the top edge is flat
const YEL = '#FFC21A'
const BLK = '#1F2228'
const CYAN = '#4FE3F5'

function useMaterials() {
  return useMemo(() => {
    const yellow = new THREE.MeshStandardMaterial({ color: YEL, roughness: 0.62, flatShading: true })
    const black = new THREE.MeshStandardMaterial({ color: BLK, roughness: 0.55, metalness: 0.1, flatShading: true })
    const led = new THREE.MeshStandardMaterial({ color: CYAN, emissive: '#1FD0EA', emissiveIntensity: 1.8, roughness: 0.3, flatShading: true })
    const wing = new THREE.MeshPhysicalMaterial({
      color: '#DDF6FA', transparent: true, opacity: 0.72, roughness: 0.25, clearcoat: 0.6,
      side: THREE.DoubleSide, depthWrite: false, flatShading: true,
    })
    const wingEdge = new THREE.LineBasicMaterial({ color: '#9CC9D6', transparent: true, opacity: 0.9 })
    return { yellow, black, led, wing, wingEdge }
  }, [])
}

/** hex prism along +Z (front face at +z). rTop = radius of the back face (taper) */
function HexZ({ r, depth, rBack, material, ...props }) {
  const geo = useMemo(() => new THREE.CylinderGeometry(rBack ?? r, r, depth, 6, 1), [r, depth, rBack])
  return <mesh geometry={geo} material={material} rotation={[Math.PI / 2, FLAT, 0]} {...props} />
}

/** standing hex prism (axis Y) */
function HexY({ r, h, material, ...props }) {
  const geo = useMemo(() => new THREE.CylinderGeometry(r * 0.9, r, h, 6, 1), [r, h])
  return <mesh geometry={geo} material={material} rotation={[0, FLAT, 0]} {...props} />
}

/** 7 hex solar cells in a honeycomb, lying in the XZ plane, extending along +X */
function HexWing({ cell = 0.2, gap = 0.02, thick = 0.02, mats }) {
  const { geo, edges, cells } = useMemo(() => {
    const s = cell + gap
    const w = s * Math.sqrt(3)
    const cells = [[0, 0], [w, 0], [2 * w, 0], [w / 2, 1.5 * s], [1.5 * w, 1.5 * s], [w / 2, -1.5 * s], [1.5 * w, -1.5 * s]]
    const geo = new THREE.CylinderGeometry(cell, cell, thick, 6)
    return { geo, edges: new THREE.EdgesGeometry(geo), cells }
  }, [cell, gap, thick])
  return (
    <group>
      {cells.map(([x, z], i) => (
        <group key={i} position={[x + cell, 0, z]}>
          <mesh geometry={geo} material={mats.wing} />
          <lineSegments geometry={edges} material={mats.wingEdge} />
        </group>
      ))}
    </group>
  )
}

const SEGS = [
  { m: 'black', r: 1.0, d: 0.3 },
  { m: 'yellow', r: 0.96, d: 0.26 },
  { m: 'black', r: 0.92, d: 0.22 },
  { m: 'yellow', r: 0.87, d: 0.22 },
  { m: 'black', r: 0.8, d: 0.2, taper: 0.62 },
]
const WINGS = [
  { sx: 1, z: -0.3, s: 1 },
  { sx: -1, z: -0.3, s: 1 },
  { sx: 1, z: -0.7, s: 0.7 },
  { sx: -1, z: -0.7, s: 0.7 },
]
const LEG_H = 0.55
const LEGS = [[-0.42, -0.35], [0.42, -0.35], [-0.42, -0.85], [0.42, -0.85]]
/** feet touch y = this (root space) */
export const BEE_GROUND_Y = -1.0 * 0.82 - LEG_H + 0.08

/**
 * @param {object} props
 * @param {number} props.yaw       base facing angle (rad). 0 = facing camera; positive = turned to viewer's right
 * @param {React.MutableRefObject} props.pointer  {x,y} in -1..1, optional — bee glances toward it
 * @param {React.MutableRefObject} props.excite   set .current = 1 to trigger a hop + wing burst (decays by itself)
 */
export default function Bee({ yaw = 0.45, hover = 0.32, pointer, excite, reducedMotion = false }) {
  const mats = useMaterials()
  const root = useRef()
  const body = useRef()
  const legs = useRef()
  const seam = useRef()
  const eyes = useRef([])
  const ants = useRef([])
  const wings = useRef([])
  const t = useRef(0)
  const hop = useRef(0)

  // energy-seam / LED materials are shared; reset intensity on unmount
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  useFrame((_, dt) => {
    if (reducedMotion) return
    const d = Math.min(dt, 0.1)
    t.current += d
    const tt = t.current
    const b = body.current
    if (!b) return

    // hop trigger from outside (new speech line)
    if (excite?.current > 0) {
      hop.current = 1
      excite.current = 0
    }
    hop.current = Math.max(0, hop.current - d * 1.6)
    const h = hop.current
    const hopY = Math.sin(Math.min(1, (1 - h) * 1.0) * Math.PI) * 0.18 * (h > 0 ? 1 : 0)

    // hovering flight: gentle bob, whole bee (legs included) turns toward the pointer
    const px = pointer?.current?.x ?? 0
    const py = pointer?.current?.y ?? 0
    const r = root.current
    if (r) {
      const targetYaw = yaw + px * 1.15 // mouse far right ≈ 90°, far left ≈ -20°
      r.rotation.y += (targetYaw - r.rotation.y) * Math.min(1, d * 6)
      r.rotation.x += (-0.1 - py * 0.16 - r.rotation.x) * Math.min(1, d * 6)
      r.rotation.z = Math.sin(tt * 0.9) * 0.05 + px * 0.06
      r.position.y = hover + Math.sin(tt * 1.7) * 0.06 + hopY
    }
    // breathing squash (body only)
    const br = Math.sin(tt * 1.8)
    b.scale.set(1 + br * 0.012, 1 + br * 0.02, 1 - br * 0.01)
    // legs dangle a little while flying
    if (legs.current) legs.current.rotation.x = 0.3 + Math.sin(tt * 1.7 + 0.8) * 0.06

    // blink
    const blink = tt % 3.4 > 3.25 ? 0.12 : 1
    eyes.current.forEach((e) => e && e.scale.set(1, blink, 1))

    // energy seam breathing
    if (seam.current) seam.current.material.emissiveIntensity = 1.2 + (0.5 + 0.5 * Math.sin(tt * 2.6)) * 1.4

    // antennae
    ants.current.forEach((a, k) => a && (a.rotation.x = -0.25 + Math.sin(tt * 2 + k * 1.5) * 0.12))

    // wings flutter in bursts every ~4s (and during a hop)
    const flap = Math.sin(tt * 52) * (0.7 + h * 0.5)
    wings.current.forEach((w, i) => w && (w.rotation.z = WINGS[i].sx * (0.25 + flap * 0.45)))
  })

  // build body segment offsets once
  const segZ = useMemo(() => {
    let z = 0
    const out = []
    SEGS.forEach((s, i) => {
      out.push(z - s.d / 2)
      z -= s.d
      if (i === 0) {
        out.seam = z - 0.015
        z -= 0.03
      }
    })
    return out
  }, [])

  return (
    <group ref={root} rotation={[0, yaw, 0]} position={[0, hover, 0]}>
      <group ref={legs} position={[0, -0.6, 0]}>
        {LEGS.map(([x, z], i) => (
          <HexY key={i} r={0.16} h={LEG_H} material={mats.black} position={[x, 0.6 - 0.82 - LEG_H / 2 + 0.08, z]} />
        ))}
      </group>
      <group ref={body}>
        <group>
          {SEGS.map((s, i) => (
            <HexZ key={i} r={s.r} depth={s.d} rBack={s.taper ? s.r * s.taper : undefined} material={mats[s.m]} position={[0, 0, segZ[i]]} />
          ))}
          {/* cyan energy seam */}
          <HexZ ref={seam} r={0.975} depth={0.03} material={mats.led} position={[0, 0, segZ.seam]} />
          {/* face */}
          <HexZ r={0.86} depth={0.08} material={mats.yellow} position={[0, 0, 0.01]} />
          {[-1, 1].map((sx, i) => (
            <HexZ key={sx} ref={(el) => (eyes.current[i] = el)} r={0.15} depth={0.08} material={mats.black} position={[sx * 0.32, 0.18, 0.08]} />
          ))}
          <mesh position={[0, -0.08, 0.07]} rotation={[0, 0, Math.PI]} material={mats.black}>
            <torusGeometry args={[0.16, 0.035, 6, 10, Math.PI]} />
          </mesh>
          {/* antennae with LED tips */}
          {[-1, 1].map((sx, i) => (
            <group key={sx} ref={(el) => (ants.current[i] = el)} position={[sx * 0.45, 0.86, -0.15]} rotation={[-0.25, 0, -sx * 0.35]}>
              <mesh position={[0, 0.25, 0]} material={mats.black}>
                <cylinderGeometry args={[0.03, 0.04, 0.5, 6]} />
              </mesh>
              <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.led}>
                <cylinderGeometry args={[0.09, 0.09, 0.12, 6]} />
              </mesh>
            </group>
          ))}
          {/* solar-cell wings */}
          {WINGS.map((w, i) => (
            <group key={i} ref={(el) => (wings.current[i] = el)} position={[w.sx * 0.4, 0.72, w.z]}>
              <group scale={[w.sx * w.s, 1, w.s]} rotation={[0.1, w.sx * 0.35, 0]}>
                <HexWing mats={mats} />
              </group>
              <mesh material={mats.black}>
                <cylinderGeometry args={[0.07, 0.07, 0.1, 6]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}
