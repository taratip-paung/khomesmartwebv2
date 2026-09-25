import { memo, useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { sunPosition } from '../../lib/solar/production'
import House from './House'

/**
 * Solar Builder 3D stage (S3.3/S3.4) — lazy chunk, only mounted on the orientation/preview steps.
 *   · house turned to the user's azimuth, roof type + slope from their inputs
 *   · compass ring on the ground: drag it (desktop / stylus) to turn the house
 *   · sun paths on the June/March/December days at this latitude, the chosen day highlighted
 *   · the sun at the chosen time drives the key light → real shadows of the house
 * World frame: north = −z, east = +x, up = +y; metres.
 * frameloop="demand": renders only when something changes (battery-friendly on phones).
 */
const rad = (d) => (d * Math.PI) / 180
/** azimuth (° from north, clockwise) + elevation → unit vector */
export const dirFrom = (az, el) => new THREE.Vector3(Math.sin(rad(az)) * Math.cos(rad(el)), Math.sin(rad(el)), -Math.cos(rad(az)) * Math.cos(rad(el)))

function letterTexture(ch, color) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.font = '700 84px system-ui, -apple-system, "Segoe UI", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = color
  g.fillText(ch, 64, 70)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const Compass = memo(function Compass({ R, dark, onAzimuth, controls }) {
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: dark ? '#35d6ff' : '#1f7fbf',
        transparent: true,
        opacity: 0.85,
      }),
    [dark],
  )
  const hitMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  )
  const letters = useMemo(
    () =>
      [
        ['N', 0, '#ff5a5a'],
        ['E', 90],
        ['S', 180],
        ['W', 270],
      ].map(([ch, az, col]) => ({
        ch,
        az,
        mat: new THREE.SpriteMaterial({
          map: letterTexture(ch, col ?? (dark ? '#e8f4ff' : '#1b2536')),
          depthWrite: false,
        }),
      })),
    [dark],
  )
  const ticks = useMemo(() => {
    const out = []
    for (let a = 0; a < 360; a += 15) {
      const len = a % 90 === 0 ? 1.1 : a % 45 === 0 ? 0.7 : 0.4
      const p = dirFrom(a, 0)
      out.push([p.clone().multiplyScalar(R), p.clone().multiplyScalar(R + len)])
    }
    return out
  }, [R])
  const dragging = useRef(false)
  const pick = (e) => {
    const az = ((Math.atan2(e.point.x, -e.point.z) * 180) / Math.PI + 360) % 360
    onAzimuth?.((Math.round(az / 5) * 5) % 360)
  }
  return (
    <group position={[0, 0.03, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={ringMat}>
        <ringGeometry args={[R - 0.12, R, 96]} />
      </mesh>
      {ticks.map(([a, b], i) => (
        <Line key={i} points={[a, b]} color={dark ? '#9fe6ff' : '#2a6f9e'} lineWidth={1.5} transparent opacity={0.9} />
      ))}
      {letters.map(({ ch, az, mat }) => {
        const p = dirFrom(az, 0).multiplyScalar(R + 2.2)
        return <sprite key={ch} material={mat} position={[p.x, 1.1, p.z]} scale={[2.2, 2.2, 1]} />
      })}
      {onAzimuth && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          material={hitMat}
          onPointerDown={(e) => {
            if (e.pointerType === 'touch') return // touch: one finger scrolls the page (site rule); use the slider/±15° buttons
            e.stopPropagation()
            dragging.current = true
            if (controls.current) controls.current.enabled = false
            e.target.setPointerCapture(e.pointerId)
            pick(e)
          }}
          onPointerMove={(e) => dragging.current && pick(e)}
          onPointerUp={(e) => {
            dragging.current = false
            if (controls.current) controls.current.enabled = true
            e.target.releasePointerCapture?.(e.pointerId)
          }}
          onPointerOver={() => (document.body.style.cursor = 'grab')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <ringGeometry args={[R - 1.6, R + 1.6, 64]} />
        </mesh>
      )}
    </group>
  )
})

function SunPaths({ lat, Rs, day, sun, days }) {
  const paths = useMemo(
    () =>
      Object.entries(days).map(([k, n]) => {
        const pts = []
        for (let h = 4.5; h <= 19.5; h += 0.2) {
          const s = sunPosition(lat, n, h)
          if (s.elevation > -1) pts.push(dirFrom(s.azimuth, Math.max(0, s.elevation)).multiplyScalar(Rs))
        }
        return { k, n, pts }
      }),
    [lat, Rs, days],
  )
  const sunPos = dirFrom(sun.azimuth, sun.elevation).multiplyScalar(Rs)
  return (
    <group>
      {paths.map(({ k, n, pts }) =>
        pts.length > 1 ? (
          <Line
            key={k}
            points={pts}
            color={n === day ? '#ffc857' : '#ffe2a6'}
            lineWidth={n === day ? 3 : 1.2}
            transparent
            opacity={n === day ? 1 : 0.45}
            dashed={n !== day}
            dashSize={0.6}
            gapSize={0.4}
          />
        ) : null,
      )}
      {sun.elevation > 0 && (
        <>
          <mesh position={sunPos}>
            <sphereGeometry args={[1.2, 24, 16]} />
            <meshBasicMaterial color="#ffd36b" toneMapped={false} />
          </mesh>
          <mesh position={sunPos}>
            <sphereGeometry args={[2.4, 24, 16]} />
            <meshBasicMaterial color="#ffcf5a" transparent opacity={0.22} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* sun ray to the roof — shows where the light comes from */}
          <Line points={[sunPos, [0, 3.5, 0]]} color="#ffb020" lineWidth={1.5} transparent opacity={0.7} dashed dashSize={0.8} gapSize={0.5} />
        </>
      )}
    </group>
  )
}

function SunLight({ sun, R, isMobile }) {
  const light = useRef()
  const up = sun.elevation > 0
  const p = dirFrom(sun.azimuth, Math.max(2, sun.elevation)).multiplyScalar(R * 2.5)
  useEffect(() => {
    const cam = light.current?.shadow.camera
    if (!cam) return
    cam.left = cam.bottom = -R * 0.95
    cam.right = cam.top = R * 0.95
    cam.near = 1
    cam.far = R * 6
    cam.updateProjectionMatrix()
  }, [R])
  return (
    <directionalLight
      ref={light}
      position={p}
      intensity={up ? 2.2 + 1.8 * Math.sin(rad(sun.elevation)) : 0.08}
      color={up && sun.elevation < 12 ? '#ffd2a1' : '#fff6e8'}
      castShadow={up}
      shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.04}
    />
  )
}

/** scene.environment from three's RoomEnvironment (no network, no HDR download) */
function Env() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const rt = pm.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = rt.texture
    scene.environmentIntensity = 0.3 // low fill → shadows read clearly
    return () => {
      scene.environment = null
      rt.dispose()
      pm.dispose()
    }
  }, [gl, scene])
  return null
}

/** keep the whole compass in view: step the camera back on narrow (portrait) canvases */
function FitCamera({ R, controls }) {
  const { camera, size } = useThree()
  useEffect(() => {
    const vfov = rad(camera.fov)
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (size.width / size.height))
    const need = ((R + 3.2) / Math.tan(hfov / 2)) * 1.05 // width is what gets tight on portrait phones
    const dist = Math.max(R * 3.1, need)
    const t = controls.current?.target ?? new THREE.Vector3(0, 2.5, 0)
    const dir = camera.position.clone().sub(t).normalize()
    camera.position.copy(t).addScaledVector(dir, dist)
    camera.updateProjectionMatrix()
    controls.current?.update()
  }, [camera, size.width, size.height, R, controls])
  return null
}

/** site rule: plain wheel scrolls the page (zoom = Ctrl/⌘ + wheel or pinch); one finger scrolls on touch */
function ScrollFriendly({ controls }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const el = gl.domElement
    el.style.touchAction = 'pan-y'
    const before = (e) => {
      if (controls.current) controls.current.enableZoom = e.ctrlKey || e.metaKey
    }
    const after = () => {
      if (controls.current) controls.current.enableZoom = true
    }
    const twoFingers = (e) => e.touches.length > 1 && e.cancelable && e.preventDefault()
    const keep = () => {
      if (el.style.touchAction !== 'pan-y') el.style.touchAction = 'pan-y' // OrbitControls sets 'none' on connect
    }
    el.addEventListener('wheel', before, { capture: true, passive: true })
    el.addEventListener('wheel', after, { passive: true })
    el.addEventListener('touchmove', twoFingers, { passive: false })
    el.addEventListener('pointerdown', keep, { capture: true })
    keep()
    const t = setTimeout(keep, 50)
    return () => {
      clearTimeout(t)
      el.removeEventListener('wheel', before, { capture: true })
      el.removeEventListener('wheel', after)
      el.removeEventListener('touchmove', twoFingers)
      el.removeEventListener('pointerdown', keep, { capture: true })
    }
  }, [gl, controls])
  return null
}

export default function SolarScene({
  lat = 18.79,
  azimuth = 180,
  tilt = 15,
  roof = 'flat',
  size = { w: 11, d: 8 },
  day,
  solarHour,
  days,
  dark,
  onAzimuth,
  isMobile,
}) {
  const controls = useRef()
  const { w, d } = size
  const R = Math.max(w, d) * 0.75 + 4 // compass radius
  const Rs = R * 1.45 // sun-path dome radius
  const sun = useMemo(() => sunPosition(lat, day, solarHour), [lat, day, solarHour])
  const up = sun.elevation > 0
  const ground = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: dark ? '#27402e' : '#9cc38a', // soft lawn green (owner, 2026-09-25)
        roughness: 1,
      }),
    [dark],
  )
  const cam = useMemo(() => {
    const p = dirFrom(150, 32).multiplyScalar(R * 3.1) // from the south-south-east, above
    return [p.x, p.y, p.z]
  }, [R])
  return (
    <Canvas
      shadows="percentage"
      frameloop="demand"
      dpr={[1, isMobile ? 1.5 : 2]}
      camera={{ fov: 38, near: 0.5, far: 600, position: cam }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl: r }) => {
        r.setClearColor(0x000000, 0)
        r.toneMapping = THREE.ACESFilmicToneMapping
      }}
      style={{ background: 'transparent' }}
    >
      <Env />
      <hemisphereLight args={[dark ? '#8fb3ff' : '#ffffff', dark ? '#1b2230' : '#7f9a70', up ? (dark ? 0.35 : 0.5) : 0.18]} />
      <SunLight sun={sun} R={R} isMobile={isMobile} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={ground} receiveShadow>
        <circleGeometry args={[R * 6, 96]} />
      </mesh>
      <Compass R={R} dark={dark} onAzimuth={onAzimuth} controls={controls} />
      <group rotation={[0, Math.PI - rad(azimuth), 0]}>
        <House w={w} d={d} roof={roof} tilt={tilt} dark={dark} />
      </group>
      <SunPaths lat={lat} Rs={Rs} day={day} sun={sun} days={days} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping={false}
        target={[0, 2.5, 0]}
        minDistance={R * 1.2}
        maxDistance={R * 7}
        maxPolarAngle={rad(84)}
        touches={{ ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
      <ScrollFriendly controls={controls} />
      <FitCamera R={R} controls={controls} />
    </Canvas>
  )
}
