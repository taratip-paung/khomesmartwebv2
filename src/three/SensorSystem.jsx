import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Holo, { Dot } from './Holo'
import HitBox from './HitBox'

const GREEN = '#7cf5c2'
export const RND_ORIGIN = [-5, 0, 3]

/** RND_SENSOR_HUB + RND_SENSOR_01..03 */
export default function SensorSystem() {
  const core = useRef()
  const rings = useRef()
  useFrame(({ clock }, dt) => {
    if (core.current) core.current.rotation.y += dt * 0.6
    if (rings.current) rings.current.rotation.y -= dt * 0.25
  })
  return (
    <group name="RND_ROOT" position={RND_ORIGIN}>
      {/* hub mast */}
      <Holo name="RND_SENSOR_HUB" geo="cylinder" args={[0.05, 0.08, 2.4, 6]} position={[0, 1.2, 0]} group="rnd" color={GREEN} faceOpacity={0.05} />
      <Holo geo="cylinder" args={[0.45, 0.55, 0.12, 6]} position={[0, 0.06, 0]} group="rnd" color={GREEN} faceOpacity={0.08} />
      {/* rotating sensor core + orbit rings */}
      <group ref={core} position={[0, 2.7, 0]}>
        <Holo geo="octahedron" args={[0.36, 0]} group="rnd" color={GREEN} faceOpacity={0.18} pulse={0.18} />
      </group>
      <group ref={rings} position={[0, 2.7, 0]}>
        <Holo geo="torus" args={[0.65, 0.012, 6, 48]} rotation={[Math.PI / 2, 0, 0]} group="rnd" color={GREEN} faceOpacity={0.3} edgeOpacity={0} />
        <Holo geo="torus" args={[0.95, 0.012, 6, 64]} rotation={[Math.PI / 2.4, 0.3, 0]} group="rnd" color={GREEN} faceOpacity={0.22} edgeOpacity={0} />
      </group>
      {/* field sensor devices */}
      {[
        { id: '01', p: [1.2, 0.18, 0.8], r: 0.4 },
        { id: '02', p: [-1.1, 0.18, 1.1], r: -0.5 },
        { id: '03', p: [0.4, 0.18, -1.3], r: 1.2 },
      ].map((s) => (
        <group key={s.id} name={`RND_SENSOR_${s.id}`} position={s.p} rotation={[0, s.r, 0]}>
          <Holo geo="box" args={[0.5, 0.36, 0.34]} group="rnd" color={GREEN} faceOpacity={0.1} />
          <Holo geo="cylinder" args={[0.015, 0.015, 0.5, 4]} position={[0.15, 0.4, 0]} group="rnd" color={GREEN} faceOpacity={0.05} />
          <Dot position={[-0.15, 0.1, 0.18]} color={GREEN} size={0.03} group="rnd" blink={2 + Number(s.id)} />
        </group>
      ))}
      <HitBox serviceId="rnd" position={[0, 1.5, 0]} args={[3.2, 3.6, 3.2]} />
    </group>
  )
}
