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
import { applyTheme } from './materials'
import { useTheme } from '../ThemeContext'

/** Drives the highlight store + reports first rendered frame */
function SceneDriver() {
  const { selectedId, setSceneReady, reducedMotion } = useApp()
  const { theme } = useTheme()
  const frames = useRef(0)
  useEffect(() => setSelected(selectedId), [selectedId])
  useEffect(() => applyTheme(theme), [theme])
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
  const { isDark } = useTheme()
  const lite = isMobile
  const bg = isDark ? '#070c1c' : '#e9eff8'

  return (
    <Canvas
      shadows
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      camera={{ fov: 36, near: 0.1, far: 120, position: [6, 14.5, 27] }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: isDark ? 1.05 : 1.0,
      }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 26, 60]} />
      <Suspense fallback={null}>
        <group name="KHOME_SCENE">
          <Environment lite={lite} dark={isDark} />
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
            <Bloom mipmapBlur intensity={isDark ? 0.55 : 0.3} luminanceThreshold={isDark ? 1.0 : 1.3} luminanceSmoothing={0.25} radius={0.6} />
            <Vignette eskil={false} offset={0.25} darkness={isDark ? 0.55 : 0.25} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  )
}
