import Holo, { Dot } from './Holo'
import HitBox from './HitBox'

const ROOF_ANGLE = Math.atan2(0.9, 1.8) // ~26.6°
const CYAN = '#35d6ff'
const GOLD = '#ffc857'

/**
 * SMART_HOUSE + SOLAR_PANELS + SOLAR_INVERTER (plan §17 naming).
 * The house body belongs to group "house"; the solar objects to "solar".
 */
export default function SmartHouse() {
  return (
    <group name="SMART_HOUSE_ROOT">
      {/* body */}
      <Holo name="SMART_HOUSE" geo="box" args={[3.6, 2.0, 3.2]} position={[0, 1.0, 0]} group="house" color={CYAN} />
      {/* door + windows (edge-only planes) */}
      <Holo geo="plane" args={[0.7, 1.4]} position={[0.7, 0.7, 1.61]} group="house" faceOpacity={0.03} edgeOpacity={0.6} />
      <Holo geo="plane" args={[0.9, 0.6]} position={[-0.8, 1.25, 1.61]} group="house" faceOpacity={0.05} edgeOpacity={0.6} />
      <Holo geo="plane" args={[0.9, 0.6]} position={[1.81, 1.25, -0.6]} rotation={[0, Math.PI / 2, 0]} group="house" faceOpacity={0.05} edgeOpacity={0.6} />
      <Holo geo="plane" args={[0.9, 0.6]} position={[1.81, 1.25, 0.6]} rotation={[0, Math.PI / 2, 0]} group="house" faceOpacity={0.05} edgeOpacity={0.6} />
      {/* gable roof — two slabs, ridge along z */}
      <Holo geo="box" args={[2.05, 0.08, 3.5]} position={[-0.9, 2.45, 0]} rotation={[0, 0, ROOF_ANGLE]} group="house" faceOpacity={0.09} />
      <Holo geo="box" args={[2.05, 0.08, 3.5]} position={[0.9, 2.45, 0]} rotation={[0, 0, -ROOF_ANGLE]} group="house" faceOpacity={0.09}>
        {/* SOLAR_PANELS — sit on the +x slope in the slab's local space */}
        <group name="SOLAR_PANELS" position={[0, 0.08, 0]}>
          {[-0.55, 0, 0.55].map((x) =>
            [-1.05, 0, 1.05].map((z) => (
              <Holo
                key={`${x}${z}`}
                geo="box"
                args={[0.5, 0.04, 0.95]}
                position={[x, 0, z]}
                group="solar"
                color={GOLD}
                faceOpacity={0.16}
                edgeOpacity={0.95}
                pulse={0.12}
              />
            )),
          )}
        </group>
      </Holo>
      {/* SOLAR_INVERTER on the +x wall */}
      <Holo name="SOLAR_INVERTER" geo="box" args={[0.16, 0.55, 0.38]} position={[1.9, 0.9, -1.0]} group="solar" color={GOLD} faceOpacity={0.12}>
        <Dot position={[0.09, 0.15, 0]} color={GOLD} size={0.035} group="solar" blink={3} />
        <Dot position={[0.09, 0.05, 0]} color={CYAN} size={0.035} group="solar" blink={5} />
      </Holo>
      {/* chimney / vent for silhouette */}
      <Holo geo="box" args={[0.3, 0.6, 0.3]} position={[-1.2, 2.9, -1.0]} group="house" faceOpacity={0.06} />

      <HitBox serviceId="solar" position={[0.9, 2.55, 0]} args={[2.2, 0.9, 3.6]} />
    </group>
  )
}
