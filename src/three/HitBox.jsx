import { useState } from 'react'
import { useApp } from '../AppContext'
import { serviceById } from '../data/services'
import HoverAura from './HoverAura'

/**
 * Invisible click target around a service zone. Single click and double
 * click both focus the service — identical to clicking its card/marker.
 * Hovering shows a rising light aura around the zone (`aura` can turn it off
 * for secondary hit boxes so a zone never gets two auras).
 */
export default function HitBox({ serviceId, position, args, aura = true }) {
  const { select } = useApp()
  const [hover, setHover] = useState(false)
  const [w, h, d] = args
  const accent = serviceById[serviceId]?.accent ?? '#35d6ff'
  return (
    <group>
      <mesh
        position={position}
        onClick={(e) => {
          e.stopPropagation()
          select(serviceId)
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          select(serviceId)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <boxGeometry args={args} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {aura && (
        <HoverAura
          active={hover}
          position={[position[0], position[1] - h / 2 + (h * 1.25) / 2, position[2]]}
          radius={Math.max(w, d) * 0.56}
          height={h * 1.25}
          color={accent}
        />
      )}
    </group>
  )
}
