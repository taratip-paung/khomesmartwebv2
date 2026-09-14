import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
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
    tick(Math.min(dt, 0.1), reducedMotion)
    if (frames.current < 3 && ++frames.current === 3) setSceneReady(true)
  })
  return null
}

/**
 * KHOME_SCENE — the whole smart ecosystem. To swap in the Blender GLB later,
 * replace the four system components with a <Gltf> loader whose nodes are
 * wired to the same highlight groups + HitBoxes (see README).
 */
export default function Scene() {
  const { isMobile } = useApp()
  const lite = isMobile

  return (
    <Canvas
      shadows
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      camera={{ fov: 36, near: 0.1, far: 120, position: [6, 14.5, 27] }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
    >
      <color attach="background" args={['#070c1c']} />
      <fog attach="fog" args={['#070c1c', 26, 60]} />
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
        {!lite && (
          <EffectComposer multisampling={4}>
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1.0} luminanceSmoothing={0.25} radius={0.6} />
            <Vignette eskil={false} offset={0.25} darkness={0.55} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  )
}
