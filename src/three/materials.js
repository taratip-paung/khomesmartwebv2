import * as THREE from 'three'
import { registerMaterial } from './highlight'

/**
 * Shared PBR material library. Materials are cached per (group, kind, overrides)
 * so a whole service zone shares a handful of materials — cheap to render and
 * cheap for the highlight system to dim/boost per frame.
 *
 * When the Blender GLB arrives, its materials can be registered the same way:
 *   registerMaterial('solar', node.material) after storing userData.base.
 */
const cache = new Map()

const KINDS = {
  // brushed aluminium / steel
  metal: () => new THREE.MeshStandardMaterial({ color: '#b9c6d6', metalness: 0.9, roughness: 0.32, envMapIntensity: 1.2 }),
  darkMetal: () => new THREE.MeshStandardMaterial({ color: '#3a4556', metalness: 0.85, roughness: 0.4, envMapIntensity: 1 }),
  // dark composite cladding
  body: () => new THREE.MeshStandardMaterial({ color: '#151d2f', metalness: 0.35, roughness: 0.55, envMapIntensity: 0.8 }),
  // light architectural panel
  white: () => new THREE.MeshStandardMaterial({ color: '#dfe6ef', metalness: 0.1, roughness: 0.55, envMapIntensity: 0.7 }),
  concrete: () => new THREE.MeshStandardMaterial({ color: '#2a3244', metalness: 0.05, roughness: 0.92 }),
  asphalt: () => new THREE.MeshStandardMaterial({ color: '#10151f', metalness: 0.05, roughness: 0.95 }),
  ground: () => new THREE.MeshStandardMaterial({ color: '#141b2c', metalness: 0.1, roughness: 0.9 }),
  lawn: () => new THREE.MeshStandardMaterial({ color: '#1c3b30', metalness: 0, roughness: 1 }),
  foliage: () => new THREE.MeshStandardMaterial({ color: '#2a6e45', metalness: 0, roughness: 0.95, flatShading: true }),
  foliage2: () => new THREE.MeshStandardMaterial({ color: '#3a8a55', metalness: 0, roughness: 0.95, flatShading: true }),
  bark: () => new THREE.MeshStandardMaterial({ color: '#4a3527', metalness: 0, roughness: 1 }),
  wood: () => new THREE.MeshStandardMaterial({ color: '#9a6a44', metalness: 0.05, roughness: 0.7 }),
  stone: () => new THREE.MeshStandardMaterial({ color: '#6e737d', metalness: 0.05, roughness: 0.85 }),
  blackStone: () => new THREE.MeshStandardMaterial({ color: '#141821', metalness: 0.2, roughness: 0.45, envMapIntensity: 1.2 }),
  graphite: () => new THREE.MeshStandardMaterial({ color: '#2a3244', metalness: 0.8, roughness: 0.3, envMapIntensity: 2.0, flatShading: true }),
  graphiteBody: () => new THREE.MeshStandardMaterial({ color: '#171c28', metalness: 0.6, roughness: 0.5, envMapIntensity: 1.0 }),
  grille: () => new THREE.MeshStandardMaterial({ map: grilleTexture(), color: '#ffffff', metalness: 0.5, roughness: 0.6 }),
  fabric: () => new THREE.MeshStandardMaterial({ color: '#c9c2b6', metalness: 0, roughness: 0.95 }),
  water: () =>
    new THREE.MeshPhysicalMaterial({
      color: '#4fc8e8',
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.75,
      envMapIntensity: 2.2,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
  // real refractive glass — use sparingly (transmission is expensive)
  glass: () =>
    new THREE.MeshPhysicalMaterial({
      color: '#bfe9ff',
      metalness: 0,
      roughness: 0.08,
      transmission: 0.92,
      thickness: 0.6,
      ior: 1.45,
      envMapIntensity: 1.6,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
  // cheap tinted glass (no transmission) — windows, rack doors
  glassTint: () =>
    new THREE.MeshPhysicalMaterial({
      color: '#7fd4ff',
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.28,
      envMapIntensity: 1.8,
      clearcoat: 1,
      depthWrite: false,
    }),
  // glowing surfaces (bloom picks these up: intensity > 1, not tone-mapped)
  emissive: (o) =>
    new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: o.color ?? '#35d6ff',
      emissiveIntensity: o.intensity ?? 2.5,
      toneMapped: false,
      roughness: 1,
    }),
  // solar cells — dark blue glass with a procedural cell grid
  // all-black frameless PV (premium look)
  solarBlack: () =>
    new THREE.MeshStandardMaterial({
      map: solarTexture(true),
      color: '#ffffff',
      metalness: 0.7,
      roughness: 0.12,
      envMapIntensity: 2.4,
    }),
  solar: () =>
    new THREE.MeshStandardMaterial({
      map: solarTexture(),
      color: '#ffffff',
      metalness: 0.5,
      roughness: 0.15,
      envMapIntensity: 2.2,
    }),
}

/* ---------- theme ---------- */
/** Ground/architecture colours that differ between the dark (night) and light (day) scene */
const THEME_COLORS = {
  ground: { dark: '#141b2c', light: '#a9b7c9' },
  concrete: { dark: '#2a3244', light: '#94a1b3' },
  asphalt: { dark: '#10151f', light: '#4a5468' },
  lawn: { dark: '#1c3b30', light: '#5b9a6a' },
  body: { dark: '#151d2f', light: '#2b3650' },
  wood: { dark: '#8a5c3a', light: '#b07a4e' },
  stone: { dark: '#4f545e', light: '#8d939d' },
  foliage: { dark: '#2a6e45', light: '#3f9a5c' },
  foliage2: { dark: '#3a8a55', light: '#58b774' },
}
let currentTheme = 'dark'
export function applyTheme(theme) {
  currentTheme = theme
  for (const m of cache.values()) {
    if (!m.userData.themed) continue
    m.userData.base.color.set(THEME_COLORS[m.userData.kind][theme])
  }
}

export function mat(group, kind, overrides = {}) {
  const key = `${group}|${kind}|${JSON.stringify(overrides)}`
  if (cache.has(key)) return cache.get(key)
  const m = KINDS[kind](overrides)
  if (overrides.color && kind !== 'emissive') m.color.set(overrides.color)
  if (overrides.roughness !== undefined) m.roughness = overrides.roughness
  if (overrides.metalness !== undefined) m.metalness = overrides.metalness
  if (overrides.opacity !== undefined) {
    m.transparent = true
    m.opacity = overrides.opacity
  }
  m.userData.kind = kind
  m.userData.themed = kind in THEME_COLORS && !overrides.color
  if (m.userData.themed) m.color.set(THEME_COLORS[kind][currentTheme])
  m.userData.base = {
    color: kind === 'emissive' ? null : m.color.clone(),
    ei: m.emissiveIntensity > 0 && kind === 'emissive' ? m.emissiveIntensity : undefined,
    opacity: m.transparent && kind !== 'glass' ? m.opacity : undefined,
  }
  registerMaterial(group, m)
  cache.set(key, m)
  return m
}

const _solarTexCache = {}
function solarTexture(black = false) {
  if (_solarTexCache[black]) return _solarTexCache[black]
  const c = document.createElement('canvas')
  c.width = 384
  c.height = 256
  const g = c.getContext('2d')
  // base: deep blue cell colour with slight gradient
  const grad = g.createLinearGradient(0, 0, 384, 256)
  grad.addColorStop(0, black ? '#171b26' : '#1d4ba6')
  grad.addColorStop(1, black ? '#0b0e16' : '#10317a')
  g.fillStyle = grad
  g.fillRect(0, 0, 384, 256)
  // cell grid (10 × 6)
  g.strokeStyle = black ? '#2b3140' : '#d6e0ec'
  g.lineWidth = 3
  for (let i = 0; i <= 10; i++) {
    const x = (i * 384) / 10
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, 256)
    g.stroke()
  }
  for (let j = 0; j <= 6; j++) {
    const y = (j * 256) / 6
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(384, y)
    g.stroke()
  }
  // busbars (thin lines inside each cell)
  g.strokeStyle = black ? 'rgba(70,78,95,0.6)' : 'rgba(210,225,240,0.6)'
  g.lineWidth = 1
  for (let j = 0; j < 6; j++) {
    for (let b = 1; b <= 2; b++) {
      const y = (j * 256) / 6 + (b * 256) / 18
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(384, y)
      g.stroke()
    }
  }
  // frame border
  g.strokeStyle = black ? '#1a1e28' : '#9aa8b8'
  g.lineWidth = 6
  g.strokeRect(0, 0, 384, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  _solarTexCache[black] = tex
  return tex
}

let _grille
function grilleTexture() {
  if (_grille) return _grille
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#0a0d14'
  g.fillRect(0, 0, 128, 128)
  g.fillStyle = '#2a3040'
  for (let y = 4; y < 128; y += 8) for (let x = 4; x < 128; x += 8) g.fillRect(x - 2, y - 2, 4, 4)
  _grille = new THREE.CanvasTexture(c)
  _grille.wrapS = _grille.wrapT = THREE.RepeatWrapping
  _grille.repeat.set(6, 14)
  _grille.colorSpace = THREE.SRGBColorSpace
  return _grille
}

/* ---------- geometry cache (shared across meshes) ---------- */
const geoCache = new Map()
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
  capsule: (a) => new THREE.CapsuleGeometry(...a),
  // right-triangle prism: width w along x (tall side at -x), rise h, depth d along z
  wedge: ([w, h, d]) => {
    const sh = new THREE.Shape()
    sh.moveTo(-w / 2, 0)
    sh.lineTo(w / 2, 0)
    sh.lineTo(-w / 2, h)
    sh.closePath()
    const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false })
    g.translate(0, 0, -d / 2)
    g.computeVertexNormals()
    return g
  },
}
export function geo(kind, args) {
  const key = `${kind}|${args.join(',')}`
  if (!geoCache.has(key)) geoCache.set(key, geometryFactories[kind](args))
  return geoCache.get(key)
}
