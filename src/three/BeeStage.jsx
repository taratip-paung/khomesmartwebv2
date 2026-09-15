import { useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Bee, { BEE_GROUND_Y } from './Bee'
import { useApp } from '../AppContext'

/** soft radial contact shadow under the feet (cheap: one textured circle) */
function ContactShadow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64)
    grad.addColorStop(0, 'rgba(10,16,30,0.42)')
    grad.addColorStop(1, 'rgba(10,16,30,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BEE_GROUND_Y + 0.005, -0.5]} scale={[2.6, 1.9, 1]}>
      <circleGeometry args={[1, 32]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

/**
 * Transparent mini-canvas for the mascot. Pointer glance uses window mousemove
 * so the bee reacts even though the canvas itself is tiny.
 */
export default function BeeStage({ excite }) {
  const { reducedMotion } = useApp()
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={reducedMotion ? 'demand' : 'always'}
      camera={{ fov: 30, near: 0.1, far: 30, position: [2.2, 1.3, 6.2] }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping, powerPreference: 'low-power' }}
      onCreated={({ camera }) => camera.lookAt(0, -0.25, -0.4)}
      style={{ background: 'transparent' }}
    >
      <hemisphereLight args={['#ffffff', '#8a94a6', 0.55]} />
      <directionalLight position={[4, 7, 5]} intensity={1.0} />
      <directionalLight position={[-5, 3, -4]} intensity={0.45} color="#bfe9f5" />
      <Bee yaw={0.6} pointer={pointer} excite={excite} reducedMotion={reducedMotion} />
      <ContactShadow />
    </Canvas>
  )
}
