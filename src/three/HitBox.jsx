import { useState } from 'react'
import { useApp } from '../AppContext'

/**
 * Invisible click target around a service zone. Single click and double
 * click both focus the service — identical to clicking its card/marker.
 */
export default function HitBox({ serviceId, position, args }) {
  const { select } = useApp()
  const [hover, setHover] = useState(false)
  return (
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
      <meshBasicMaterial transparent opacity={hover ? 0.03 : 0} color="#35d6ff" depthWrite={false} />
    </mesh>
  )
}
