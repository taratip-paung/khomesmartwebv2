import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useApp } from '../AppContext'
import { cameraLimits, cameraTargets, portraitDistanceFactor } from '../data/cameraTargets'
import { serviceById } from '../data/services'

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
    flyTo(key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, resetNonce])

  // initial placement
  useEffect(() => {
    flyTo('default', true)
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
    // auto-rotate only when idle, nothing selected, no tween
    c.autoRotate = !reducedMotion && !selectedId && !tw && idle.current && performance.now() - idleTimer.current > 4000
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
      autoRotateSpeed={0.35}
      minDistance={cameraLimits.minDistance}
      maxDistance={cameraLimits.maxDistance}
      minPolarAngle={cameraLimits.minPolarAngle}
      maxPolarAngle={cameraLimits.maxPolarAngle}
      onStart={() => {
        tween.current = null // user takes over
        idle.current = false
      }}
      onEnd={() => {
        idle.current = true
        idleTimer.current = performance.now()
      }}
    />
  )
}
