import { Sparkles } from '@react-three/drei'
import Holo from './Holo'

const trees = [
  [-3.2, 0, -3.6], [-6.5, 0, -1.5], [-2.4, 0, 5.6], [2.6, 0, 6.4], [7.6, 0, 0.6], [-7.2, 0, -4.2], [3.8, 0, -6.4], [-0.8, 0, -6.2],
]

function Tree({ position }) {
  return (
    <group position={position}>
      <Holo geo="cylinder" args={[0.04, 0.06, 0.5, 4]} position={[0, 0.25, 0]} group="base" color="#4f8cff" faceOpacity={0.05} edgeOpacity={0.5} />
      <Holo geo="cone" args={[0.42, 1.0, 5]} position={[0, 1.0, 0]} group="base" color="#4f8cff" faceOpacity={0.06} edgeOpacity={0.55} />
    </group>
  )
}

/** Floating platform, grid floor, ambient particles, trees, road */
export default function Environment({ lite = false }) {
  return (
    <group name="ENVIRONMENT">
      {/* platform rings */}
      <Holo geo="torus" args={[9.6, 0.02, 4, 128]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} group="base" faceOpacity={0.5} edgeOpacity={0} />
      <Holo geo="torus" args={[9.1, 0.01, 4, 128]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} group="base" faceOpacity={0.2} edgeOpacity={0} />
      {/* platform slab (thin, gives the "floating island" edge) */}
      <Holo geo="cylinder" args={[9.6, 8.8, 0.5, 64, 1, true]} position={[0, -0.26, 0]} group="base" faceOpacity={0.05} edgeOpacity={0.3} edgeThreshold={80} />
      <gridHelper args={[19, 19, '#3a86d0', '#1f4070']} position={[0, 0.005, 0]}>
        <lineBasicMaterial attach="material" transparent opacity={0.35} depthWrite={false} />
      </gridHelper>
      {/* road: house → outer edge */}
      <Holo geo="plane" args={[1.4, 7]} position={[0, 0.02, 5.5]} rotation={[-Math.PI / 2, 0, 0]} group="base" faceOpacity={0.035} edgeOpacity={0.35} />
      {trees.map((p, i) => (
        <Tree key={i} position={p} />
      ))}
      {!lite && <Sparkles count={70} scale={[20, 8, 20]} position={[0, 4, 0]} size={0.6} speed={0.2} color="#8fd9ff" opacity={0.45} />}
    </group>
  )
}
