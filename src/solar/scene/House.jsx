import { memo, useMemo } from 'react'
import * as THREE from 'three'

/**
 * Procedural house for Solar Builder (S3.3/S3.4). Local frame: front (the panel side) = +z,
 * ridge along x, ground at y = 0. The caller turns the whole group to the chosen azimuth.
 *   flat  — white slab + parapet, panels on tilted racks facing the front
 *   gable — two slopes (จั่ว), panels flush on the front slope
 *   hip   — four slopes (ปั้นหยา), panels flush on the front trapezoid
 * Slope angle = the user's tilt (clamped 10–40°), so what they set is what they see.
 */
const WALL_H = 3
const OVER = 0.5 // eave overhang (m)
const PANEL = { w: 1.13, h: 2.28, gap: 0.04 } // typical 580–620 W module, portrait

function useMats(dark) {
  return useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({
        color: dark ? '#cfd6e0' : '#eef1f5',
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
      trim: new THREE.MeshStandardMaterial({
        color: '#2b3342',
        roughness: 0.6,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: dark ? '#ffd49a' : '#3f5f82',
        emissive: dark ? '#ffb45e' : '#000000',
        emissiveIntensity: dark ? 0.9 : 0,
        roughness: 0.15,
        metalness: 0.3,
      }),
      roofTile: new THREE.MeshStandardMaterial({
        color: '#7a4535',
        roughness: 0.75,
        side: THREE.DoubleSide,
        flatShading: true,
      }),
      slab: new THREE.MeshStandardMaterial({
        color: '#e4e8ee',
        roughness: 0.7,
      }),
      cell: new THREE.MeshStandardMaterial({
        color: '#12254a',
        roughness: 0.22,
        metalness: 0.35,
      }),
      frame: new THREE.MeshStandardMaterial({
        color: '#b9c3cf',
        roughness: 0.4,
        metalness: 0.6,
      }),
      rack: new THREE.MeshStandardMaterial({
        color: '#6b7686',
        roughness: 0.5,
        metalness: 0.5,
      }),
      arrow: new THREE.MeshStandardMaterial({
        color: '#ffc857',
        emissive: '#ffb020',
        emissiveIntensity: 0.6,
        roughness: 0.4,
      }),
      plinth: new THREE.MeshStandardMaterial({
        color: '#8b95a3',
        roughness: 0.9,
      }),
    }),
    [dark],
  )
}

/** hip/gable roof as one mesh: eaves W×D at y=0, ridge from -k..k at height h (k = W/2 → gable) */
function roofGeometry(W, D, h, k) {
  const a = [-W / 2, 0, D / 2]
  const b = [W / 2, 0, D / 2]
  const c = [W / 2, 0, -D / 2]
  const d = [-W / 2, 0, -D / 2]
  const r1 = [-k, h, 0]
  const r2 = [k, h, 0]
  const tris = [
    [a, b, r2],
    [a, r2, r1], // front
    [c, d, r1],
    [c, r1, r2], // back
    [b, c, r2], // right end
    [d, a, r1], // left end
  ]
  const pos = new Float32Array(tris.flat(2))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}

/** grid of modules on a plane (local x across, local z down-slope), plane normal = local +y */
function PanelGrid({ cols, rows, m }) {
  const cells = []
  const pw = PANEL.w + PANEL.gap
  const ph = PANEL.h + PANEL.gap
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++)
      cells.push(
        <group key={`${i}-${j}`} position={[(i - (cols - 1) / 2) * pw, 0, (j - (rows - 1) / 2) * ph]}>
          <mesh material={m.frame} castShadow receiveShadow>
            <boxGeometry args={[PANEL.w, 0.04, PANEL.h]} />
          </mesh>
          <mesh material={m.cell} position={[0, 0.022, 0]} receiveShadow>
            <boxGeometry args={[PANEL.w - 0.05, 0.01, PANEL.h - 0.05]} />
          </mesh>
        </group>,
      )
  return <>{cells}</>
}

function FlatRoof({ w, d, tilt, m }) {
  const rad = (tilt * Math.PI) / 180
  const cols = Math.max(2, Math.floor((w * 0.8) / (PANEL.w + PANEL.gap)))
  const rowDepth = PANEL.h * Math.cos(rad)
  const pitch = rowDepth + Math.max(0.5, PANEL.h * Math.sin(rad) * 1.6) // row spacing so rows don't shade each other
  const rows = Math.max(1, Math.floor((d * 0.72) / pitch))
  const z0 = -((rows - 1) * pitch) / 2
  return (
    <group position={[0, WALL_H, 0]}>
      <mesh material={m.slab} position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.4, 0.3, d + 0.4]} />
      </mesh>
      {[
        [0, d / 2 + 0.15, w + 0.4, 0.1],
        [0, -d / 2 - 0.15, w + 0.4, 0.1],
        [w / 2 + 0.15, 0, 0.1, d + 0.4],
        [-w / 2 - 0.15, 0, 0.1, d + 0.4],
      ].map(([x, z, sx, sz], i) => (
        <mesh key={i} material={m.slab} position={[x, 0.5, z]} castShadow>
          <boxGeometry args={[sx, 0.4, sz]} />
        </mesh>
      ))}
      {Array.from({ length: rows }).map((_, r) => (
        <group key={r} position={[0, 0.3 + 0.15 + (PANEL.h / 2) * Math.sin(rad), z0 + r * pitch]} rotation={[rad, 0, 0]}>
          <PanelGrid cols={cols} rows={1} m={m} />
        </group>
      ))}
      {/* rack legs */}
      {Array.from({ length: rows }).map((_, r) => (
        <mesh key={`l${r}`} material={m.rack} position={[0, 0.3 + (PANEL.h * Math.sin(rad)) / 2, z0 + r * pitch - (PANEL.h / 2) * Math.cos(rad) + 0.05]}>
          <boxGeometry args={[cols * (PANEL.w + PANEL.gap), Math.max(0.05, PANEL.h * Math.sin(rad)), 0.05]} />
        </mesh>
      ))}
    </group>
  )
}

function PitchedRoof({ w, d, tilt, hip, m }) {
  const p = (Math.min(40, Math.max(10, tilt)) * Math.PI) / 180
  const W = w + 2 * OVER
  const D = d + 2 * OVER
  const h = (D / 2) * Math.tan(p)
  const k = hip ? Math.max(0, W / 2 - D / 2) : W / 2
  const geo = useMemo(() => roofGeometry(W, D, h, k), [W, D, h, k])
  // front slope plane: through the eave (z = D/2, y = 0) and the ridge (z = 0, y = h)
  const slopeLen = D / 2 / Math.cos(p)
  const usableW = hip ? 2 * k + (D / 2) * 0.6 : W * 0.86
  const cols = Math.max(1, Math.floor(usableW / (PANEL.w + PANEL.gap)))
  const rows = Math.max(1, Math.floor((slopeLen * 0.82) / (PANEL.h + PANEL.gap)))
  return (
    <group position={[0, WALL_H, 0]}>
      <mesh geometry={geo} material={m.roofTile} castShadow receiveShadow />
      {/* gable-end walls under a gable roof */}
      {!hip &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[(s * w) / 2, 0, 0]} rotation={[0, (s * Math.PI) / 2, 0]} material={m.wall} castShadow>
            <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, (d / 2) * Math.tan(p))])]} />
          </mesh>
        ))}
      <group position={[0, h / 2 + 0.06, D / 4]} rotation={[p, 0, 0]}>
        <PanelGrid cols={cols} rows={rows} m={m} />
      </group>
    </group>
  )
}

export default memo(function House({ w = 11, d = 8, roof = 'flat', tilt = 15, dark = false }) {
  const m = useMats(dark)
  const win = (x, z, ry, width = 1.6) => (
    <mesh key={`${x}${z}`} material={m.glass} position={[x, 1.6, z]} rotation={[0, ry, 0]}>
      <boxGeometry args={[width, 1.3, 0.06]} />
    </mesh>
  )
  const nFront = Math.max(2, Math.floor(w / 3.2))
  return (
    <group>
      <mesh material={m.plinth} position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[w + 1.2, 0.2, d + 1.2]} />
      </mesh>
      <mesh material={m.wall} position={[0, WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, WALL_H, d]} />
      </mesh>
      {Array.from({ length: nFront }).map((_, i) => win(-w / 2 + ((i + 0.5) * w) / nFront, d / 2 + 0.02, 0))}
      {Array.from({ length: nFront }).map((_, i) => win(-w / 2 + ((i + 0.5) * w) / nFront, -d / 2 - 0.02, 0))}
      {win(w / 2 + 0.02, 0, Math.PI / 2, 1.4)}
      {win(-w / 2 - 0.02, 0, Math.PI / 2, 1.4)}
      <mesh material={m.trim} position={[w / 2 - 1.4, 1.05, d / 2 + 0.03]}>
        <boxGeometry args={[1.0, 2.1, 0.06]} />
      </mesh>
      {roof === 'flat' ? <FlatRoof w={w} d={d} tilt={tilt} m={m} /> : <PitchedRoof w={w} d={d} tilt={tilt} hip={roof === 'hip'} m={m} />}
      {/* facing arrow on the ground in front of the house */}
      <group position={[0, 0.06, d / 2 + 1.4]}>
        <mesh material={m.arrow} position={[0, 0, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.35, 1.8]} />
        </mesh>
        <mesh material={m.arrow} position={[0, 0, 2.2]} rotation={[-Math.PI / 2, 0, Math.PI]}>
          <circleGeometry args={[0.7, 3]} />
        </mesh>
      </group>
    </group>
  )
})
