import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useApp } from '../AppContext'
import { cameraLimits, cameraTargets, portraitDistanceFactor } from '../data/cameraTargets'
import { serviceById } from '../data/services'

const SWAY_DEG = 20
const SWAY_RAD = (SWAY_DEG * Math.PI) / 180
const SWAY_SPEED = 0.22 // rad/s of the sine — one full left-right cycle ≈ 28 s
const SWAY_AFTER_MS = 3000
const RETURN_AFTER_MS = 25000

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Owns the camera. All moves are tweens between entries in cameraTargets.
 * - service selected  → fly to that service's target
 * - reset / deselect  → fly back to `default`
 * - user drag         → cancels the tween immediately (never fights the user)
 * - idle & nothing selected → slow auto-rotate
 */
export default function CameraController() {
  const controls = useRef()
  const { camera, size } = useThree()
  const { selectedId, resetNonce, reducedMotion, isMobile } = useApp()
  const tween = useRef(null)
  const idle = useRef(true)
  const idleTimer = useRef(0)
  const sway = useRef(null) // { home: Spherical, t0 }
  const returned = useRef(true) // starts on the hero framing
  const sph = useMemo(() => new THREE.Spherical(), [])
  const off = useMemo(() => new THREE.Vector3(), [])

  const flyTo = (key, instant) => {
    const cfg = cameraTargets[key] ?? cameraTargets.default
    const c = controls.current
    if (!c) return
    const from = { p: camera.position.clone(), t: c.target.clone() }
    const to = { p: new THREE.Vector3(...cfg.position), t: new THREE.Vector3(...cfg.target) }
    if (size.width < size.height) to.p.sub(to.t).multiplyScalar(portraitDistanceFactor).add(to.t)
    if (instant || reducedMotion) {
      camera.position.copy(to.p)
      c.target.copy(to.t)
      c.update()
      tween.current = null
      return
    }
    tween.current = { from, to, start: performance.now(), duration: cfg.duration }
  }

  // service selection → camera target
  useEffect(() => {
    const key = selectedId ? serviceById[selectedId].cameraTarget : 'default'
    idleTimer.current = performance.now()
    returned.current = !selectedId
    flyTo(key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, resetNonce])

  // initial placement (?cam=<key> overrides for previews)
  useEffect(() => {
    let key = 'default'
    try {
      const q = new URLSearchParams(window.location.search).get('cam')
      if (q && cameraTargets[q]) key = q
    } catch {
      /* ignore */
    }
    flyTo(key, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    const c = controls.current
    if (!c) return
    const tw = tween.current
    if (tw) {
      const k = easeInOutCubic(Math.min(1, (performance.now() - tw.start) / tw.duration))
      camera.position.lerpVectors(tw.from.p, tw.to.p, k)
      c.target.lerpVectors(tw.from.t, tw.to.t, k)
      if (k >= 1) tween.current = null
    }
    // idle behaviour: gentle sway (±SWAY_DEG) around the current view instead of a full orbit,
    // and after a long idle fly back to the hero framing so visitors never sit on the back side
    const now = performance.now()
    const idleFor = now - idleTimer.current
    const canIdle = !reducedMotion && !selectedId && !tw && idle.current
    if (canIdle && idleFor > RETURN_AFTER_MS && !returned.current) {
      returned.current = true
      sway.current = null
      flyTo('default')
    } else if (canIdle && idleFor > SWAY_AFTER_MS) {
      if (!sway.current) {
        off.copy(camera.position).sub(c.target)
        sway.current = { home: new THREE.Spherical().setFromVector3(off), t0: now }
      }
      const { home, t0 } = sway.current
      const el = (now - t0) / 1000
      const ramp = Math.min(1, el / 3) // ease in over 3 s
      sph.copy(home)
      sph.theta = home.theta + SWAY_RAD * ramp * Math.sin(el * SWAY_SPEED)
      sph.phi = home.phi + 0.02 * ramp * Math.sin(el * SWAY_SPEED * 0.5)
      off.setFromSpherical(sph)
      camera.position.copy(c.target).add(off)
    } else if (!canIdle) {
      sway.current = null
    }
    c.update()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      rotateSpeed={isMobile ? 0.6 : 0.8}
      zoomSpeed={0.8}
      minDistance={cameraLimits.minDistance}
      maxDistance={cameraLimits.maxDistance}
      minPolarAngle={cameraLimits.minPolarAngle}
      maxPolarAngle={cameraLimits.maxPolarAngle}
      onStart={() => {
        tween.current = null // user takes over
        idle.current = false
        sway.current = null
        returned.current = false
      }}
      onEnd={() => {
        idle.current = true
        idleTimer.current = performance.now()
      }}
    />
  )
}
