import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useApp } from '../AppContext'
import CameraController from './CameraController'
import Environment from './Environment'
import SmartHouse from './SmartHouse'
import SensorSystem from './SensorSystem'
import NetworkSystem from './NetworkSystem'
import CloudServer from './CloudServer'
import ConnectionLines from './ConnectionLines'
import Markers from './Markers'
import { setSelected, tick } from './highlight'

/** Drives the highlight store + reports first rendered frame */
function SceneDriver() {
  const { selectedId, setSceneReady, reducedMotion } = useApp()
  const frames = useRef(0)
  useEffect(() => setSelected(selectedId), [selectedId])
  useFrame((_, dt) => {
    tick(dt, reducedMotion)
    if (frames.current < 3 && ++frames.current === 3) setSceneReady(true)
  })
  return null
}

/**
 * KHOME_SCENE — the whole smart ecosystem. To swap in the Blender GLB later,
 * replace the four system components with a <Gltf> loader whose nodes are
 * wired to the same highlight groups + HitBoxes.
 */
export default function Scene() {
  const { isMobile } = useApp()
  const lite = isMobile

  return (
    <Canvas
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      camera={{ fov: 38, near: 0.1, far: 120, position: [17, 12, 19] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <group name="KHOME_SCENE">
          <Environment lite={lite} />
          <SmartHouse />
          <SensorSystem />
          <NetworkSystem />
          <CloudServer />
          <ConnectionLines lite={lite} />
          <Markers />
        </group>
        <CameraController />
        <SceneDriver />
      </Suspense>
      <fog attach="fog" args={['#060b1a', 22, 48]} />
    </Canvas>
  )
}
