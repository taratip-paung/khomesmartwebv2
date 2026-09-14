import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { P, Led, ZoneRing } from './Prim'
import { mat } from './materials'
import HitBox from './HitBox'

const GREEN = '#7cf5c2'
export const RND_ORIGIN = [-6, 0, 3]

/** Cup anemometer — spins */
function Anemometer({ position }) {
  const ref = useRef()
  useFrame((_, dt) => ref.current && (ref.current.rotation.y += dt * 4))
  return (
    <group position={position}>
      <P geo="cylinder" args={[0.012, 0.012, 0.25, 6]} m={mat('rnd', 'metal')} />
      <group ref={ref} position={[0, 0.14, 0]}>
        {[0, 1, 2].map((i) => {
          const a = (i * Math.PI * 2) / 3
          return (
            <group key={i} rotation={[0, a, 0]}>
              <P geo="cylinder" args={[0.008, 0.008, 0.16, 5]} position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} m={mat('rnd', 'metal')} />
              <P geo="sphere" args={[0.035, 10, 8]} position={[0.16, 0, 0]} m={mat('rnd', 'white')} />
            </group>
          )
        })}
      </group>
    </group>
  )
}

/** Small IoT node: white enclosure, antenna, status LED */
function SensorNode({ id, position, rotation = 0, pole = 0 }) {
  return (
    <group name={`RND_SENSOR_${id}`} position={position} rotation={[0, rotation, 0]}>
      {pole > 0 && <P geo="cylinder" args={[0.025, 0.03, pole, 8]} position={[0, pole / 2, 0]} m={mat('rnd', 'darkMetal')} />}
      <group position={[0, pole + 0.16, 0]}>
        <P geo="box" args={[0.42, 0.3, 0.26]} m={mat('rnd', 'white')} />
        <P geo="box" args={[0.36, 0.24, 0.02]} position={[0, 0, 0.14]} m={mat('rnd', 'body')} />
        <P geo="cylinder" args={[0.01, 0.01, 0.4, 6]} position={[0.15, 0.35, 0]} m={mat('rnd', 'darkMetal')} />
        <P geo="sphere" args={[0.02, 8, 8]} position={[0.15, 0.55, 0]} m={mat('rnd', 'darkMetal')} />
        <Led position={[-0.12, 0.05, 0.155]} color={GREEN} size={0.018} group="rnd" blink={2 + Number(id)} />
      </group>
    </group>
  )
}

/**
 * RND_SENSOR_HUB — weather / environmental station on a concrete pad, plus
 * three RND_SENSOR_xx field nodes. Group "rnd".
 */
export default function SensorSystem() {
  const radar = useRef()
  useFrame((_, dt) => radar.current && (radar.current.rotation.y -= dt * 0.8))
  return (
    <group name="RND_ROOT" position={RND_ORIGIN}>
      <ZoneRing position={[0, 0.012, 0]} radius={2.6} color={GREEN} group="rnd" />
      {/* pad */}
      <P geo="cylinder" args={[1.9, 2.0, 0.14, 40]} position={[0, 0.07, 0]} m={mat('rnd', 'concrete')} />
      <P geo="cylinder" args={[0.5, 0.55, 0.16, 12]} position={[0, 0.15, 0]} m={mat('rnd', 'darkMetal')} />

      {/* mast */}
      <group name="RND_SENSOR_HUB">
        <P geo="cylinder" args={[0.035, 0.05, 3.0, 12]} position={[0, 1.7, 0]} m={mat('rnd', 'metal')} />
        {/* crossarm with instruments */}
        <P geo="box" args={[1.3, 0.04, 0.04]} position={[0, 3.1, 0]} m={mat('rnd', 'metal')} />
        <Anemometer position={[-0.6, 3.12, 0]} />
        {/* wind vane */}
        <group position={[0.6, 3.12, 0]}>
          <P geo="cylinder" args={[0.012, 0.012, 0.22, 6]} position={[0, 0.1, 0]} m={mat('rnd', 'metal')} />
          <P geo="box" args={[0.32, 0.02, 0.09]} position={[0, 0.22, 0]} m={mat('rnd', 'white')} />
        </group>
        {/* radiation shield (stacked discs) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <P key={i} geo="cylinder" args={[0.09, 0.1, 0.02, 14]} position={[0.22, 2.35 + i * 0.035, 0]} m={mat('rnd', 'white')} />
        ))}
        {/* rain gauge */}
        <P geo="cylinder" args={[0.06, 0.05, 0.22, 14]} position={[-0.22, 2.6, 0]} m={mat('rnd', 'white')} />
        {/* comms enclosure + LoRa antenna + small PV */}
        <P geo="box" args={[0.32, 0.42, 0.18]} position={[0, 1.4, 0.12]} m={mat('rnd', 'white')} />
        <Led position={[0.1, 1.5, 0.215]} color={GREEN} size={0.02} group="rnd" blink={1.8} />
        <Led position={[0.03, 1.5, 0.215]} color="#35d6ff" size={0.02} group="rnd" blink={3.4} />
        <P geo="cylinder" args={[0.008, 0.008, 0.5, 6]} position={[0.1, 1.9, 0.12]} m={mat('rnd', 'darkMetal')} />
        <group position={[0, 1.95, -0.16]} rotation={[0.5, Math.PI, 0]}>
          <P geo="box" args={[0.38, 0.03, 0.28]} m={mat('rnd', 'metal')} />
          <P geo="box" args={[0.34, 0.01, 0.24]} position={[0, 0.02, 0]} m={mat('rnd', 'solar')} />
        </group>
        {/* rotating sensing head (radar/lidar) */}
        <group ref={radar} position={[0, 3.32, 0]}>
          <P geo="cylinder" args={[0.12, 0.12, 0.12, 20]} m={mat('rnd', 'body')} />
          <P geo="box" args={[0.06, 0.06, 0.03]} position={[0, 0, 0.12]} m={mat('rnd', 'emissive', { color: GREEN, intensity: 2.5 })} shadow={false} />
        </group>
      </group>

      <SensorNode id="01" position={[1.3, 0.14, 0.7]} rotation={0.6} />
      <SensorNode id="02" position={[-1.2, 0.14, 1.0]} rotation={-0.4} pole={0.9} />
      <SensorNode id="03" position={[0.5, 0.14, -1.35]} rotation={2.6} />

      <HitBox serviceId="rnd" position={[0, 1.6, 0]} args={[4, 3.8, 4]} />
    </group>
  )
}
