import { ContactShadows, Environment as DreiEnv, Lightformer, Sparkles } from '@react-three/drei'
import { P } from './Prim'
import { mat } from './materials'

const trees = [
  [-6.8, 0, -1.2, 0.85], [-2.2, 0, 6.0, 1.1], [3.0, 0, 6.8, 0.9], [8.6, 0, 0.2, 0.9],
  [-7.6, 0, -4.4, 0.8], [7.4, 0, -6.2, 0.75], [-8.2, 0, 2.0, 0.7], [0.6, 0, 8.4, 0.8],
  // backyard + back edge (so the platform reads complete from every angle)
  [-4.4, 0, -5.6, 1.25], [4.6, 0, -5.4, 1.15], [1.0, 0, -7.6, 1.3], [-2.6, 0, -7.9, 1.0], [-6.2, 0, -6.4, 0.9], [8.2, 0, -3.4, 0.85], [-8.6, 0, -1.8, 0.75],
]

/** Backyard behind the house: patio, loungers, hedge, garden lights */
function Backyard() {
  return (
    <group name="BACKYARD" position={[0, 0, -4.4]}>
      <P geo="cylinder" args={[3.6, 3.6, 0.015, 48]} position={[0, 0.008, -0.6]} m={mat('base', 'lawn')} shadow={false} />
      <P geo="box" args={[4.2, 0.06, 2.0]} position={[0, 0.03, 0.6]} m={mat('base', 'white', { color: '#cfd6de' })} />
      {/* loungers + side table */}
      {[-0.9, 0.1].map((x) => (
        <group key={x} position={[x, 0.06, 0.4]} rotation={[0, Math.PI, 0]}>
          <P geo="box" args={[0.6, 0.08, 1.3]} position={[0, 0.2, 0]} m={mat('base', 'white', { color: '#e6e1d8' })} />
          <P geo="box" args={[0.6, 0.45, 0.06]} position={[0, 0.42, -0.62]} rotation={[-0.5, 0, 0]} m={mat('base', 'white', { color: '#e6e1d8' })} />
          {[-0.25, 0.25].map((dx) =>
            [-0.55, 0.55].map((dz) => <P key={`${dx}${dz}`} geo="box" args={[0.04, 0.16, 0.04]} position={[dx, 0.08, dz]} m={mat('base', 'darkMetal')} />),
          )}
        </group>
      ))}
      <P geo="cylinder" args={[0.22, 0.22, 0.04, 16]} position={[0.9, 0.36, 0.4]} m={mat('base', 'darkMetal')} />
      <P geo="cylinder" args={[0.02, 0.02, 0.32, 8]} position={[0.9, 0.2, 0.4]} m={mat('base', 'darkMetal')} />
      {/* hedge row */}
      {[-3.0, -2.0, -1.0, 0, 1.0, 2.0, 3.0].map((x) => (
        <P key={x} geo="box" args={[0.95, 0.7, 0.5]} position={[x, 0.4, -2.6]} m={mat('base', 'foliage')} />
      ))}
      {/* garden bollard lights */}
      {[-2.3, -0.8, 0.8, 2.3].map((x) => (
        <group key={x} position={[x, 0, 1.75]}>
          <P geo="cylinder" args={[0.04, 0.04, 0.5, 8]} position={[0, 0.25, 0]} m={mat('base', 'darkMetal')} />
          <P geo="cylinder" args={[0.045, 0.045, 0.06, 8]} position={[0, 0.52, 0]} m={mat('base', 'emissive', { color: '#ffe0b0', intensity: 2.2 })} shadow={false} />
        </group>
      ))}
      {/* fire pit */}
      <P geo="cylinder" args={[0.35, 0.4, 0.25, 16]} position={[1.3, 0.18, -1.0]} m={mat('base', 'concrete')} />
      <P geo="cylinder" args={[0.2, 0.2, 0.04, 12]} position={[1.3, 0.32, -1.0]} m={mat('base', 'emissive', { color: '#ff8a3d', intensity: 2.5 })} shadow={false} />
    </group>
  )
}

/** Battery / electrical cabinet behind the server racks */
function PowerCabinet() {
  return (
    <group name="POWER_CABINET" position={[8.6, 0, 4.2]} rotation={[0, -0.5, 0]}>
      <P geo="box" args={[1.2, 0.12, 0.8]} position={[0, 0.06, 0]} m={mat('base', 'concrete')} />
      <P geo="box" args={[1.0, 1.3, 0.6]} position={[0, 0.77, 0]} m={mat('base', 'white', { color: '#c7d0da' })} />
      <P geo="box" args={[0.9, 0.5, 0.02]} position={[0, 0.9, 0.31]} m={mat('base', 'body', { color: '#0b0f17' })} shadow={false} />
      {[0, 1, 2].map((i) => (
        <P key={i} geo="box" args={[0.7, 0.03, 0.02]} position={[0, 0.45 + i * 0.12, 0.31]} m={mat('base', 'emissive', { color: i === 2 ? '#35d6ff' : '#7cf5c2', intensity: 1.6 })} shadow={false} />
      ))}
      <P geo="cylinder" args={[0.03, 0.03, 0.6, 6]} position={[0.42, 1.6, -0.1]} m={mat('base', 'darkMetal')} />
    </group>
  )
}

function Tree({ position, s = 1 }) {
  const [x, y, z] = position
  return (
    <group position={[x, y, z]} scale={s}>
      <P geo="cylinder" args={[0.06, 0.09, 0.7, 7]} position={[0, 0.35, 0]} m={mat('base', 'bark')} />
      <P geo="icosahedron" args={[0.58, 1]} position={[0, 1.0, 0]} rotation={[0.3, 0.5, 0]} m={mat('base', 'foliage')} />
      <P geo="icosahedron" args={[0.44, 1]} position={[0.26, 1.38, 0.1]} rotation={[0.8, 0.2, 0.4]} m={mat('base', 'foliage2')} />
      <P geo="icosahedron" args={[0.38, 1]} position={[-0.3, 1.3, -0.15]} rotation={[0.1, 1.2, 0.6]} m={mat('base', 'foliage')} />
    </group>
  )
}

function StreetLight({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <P geo="cylinder" args={[0.03, 0.05, 2.6, 8]} position={[0, 1.3, 0]} m={mat('base', 'darkMetal')} />
      <P geo="box" args={[0.6, 0.04, 0.04]} position={[0.28, 2.6, 0]} m={mat('base', 'darkMetal')} />
      <P geo="box" args={[0.3, 0.05, 0.14]} position={[0.55, 2.58, 0]} m={mat('base', 'darkMetal')} />
      <P geo="box" args={[0.26, 0.01, 0.1]} position={[0.55, 2.55, 0]} m={mat('base', 'emissive', { color: '#dff4ff', intensity: 2 })} shadow={false} />
    </group>
  )
}

/** Road with centre dashes */
function Road({ position, length, rotation = 0, width = 1.6 }) {
  const dashes = Math.floor(length / 0.9)
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <P geo="box" args={[width, 0.02, length]} m={mat('base', 'asphalt')} shadow={false} />
      {Array.from({ length: dashes }).map((_, i) => (
        <P key={i} geo="box" args={[0.05, 0.005, 0.4]} position={[0, 0.012, -length / 2 + 0.5 + i * 0.9]} m={mat('base', 'white', { color: '#e6ecf3' })} shadow={false} />
      ))}
    </group>
  )
}

/**
 * Floating platform, roads, greenery, street lights, lighting rig,
 * contact shadows and ambient particles.
 */
export default function Environment({ lite = false, dark = true }) {
  return (
    <group name="ENVIRONMENT">
      {/* platform: dark top, chamfered edge, glowing rim */}
      <P geo="cylinder" args={[10.4, 10.0, 0.7, 96]} position={[0, -0.35, 0]} m={mat('base', 'ground')} />
      <P geo="cylinder" args={[10.42, 10.42, 0.03, 96, 1, true]} position={[0, -0.05, 0]} m={mat('base', 'emissive', { color: '#35d6ff', intensity: 1.5 })} shadow={false} receive={false} />
      <P geo="cylinder" args={[9.2, 9.8, 0.6, 96]} position={[0, -1.0, 0]} m={mat('base', 'body', { color: '#0b1020' })} />
      {/* lawns */}
      <P geo="cylinder" args={[3.2, 3.2, 0.015, 48]} position={[-4.2, 0.008, -3.2]} m={mat('base', 'lawn')} shadow={false} />
      <P geo="cylinder" args={[2.6, 2.6, 0.015, 48]} position={[2.6, 0.008, 7.0]} m={mat('base', 'lawn')} shadow={false} />
            {/* roads: house → south edge, and a ring road link east */}
      <Road position={[1.2, 0.012, 6.6]} length={6.8} />
      <Road position={[3.2, 0.012, -0.6]} length={5.4} rotation={Math.PI / 2} width={1.1} />
      <Road position={[-3.2, 0.012, 3.2]} length={5.2} rotation={Math.PI / 2} width={1.0} />

      <Backyard />
      <PowerCabinet />
      {trees.map(([x, y, z, s], i) => (
        <Tree key={i} position={[x, y, z]} s={s} />
      ))}
      <StreetLight position={[2.3, 0, 4.6]} rotation={Math.PI} />
      <StreetLight position={[2.3, 0, 8.2]} rotation={Math.PI} />
      <StreetLight position={[3.0, 0, -3.2]} rotation={Math.PI / 2} />
      <StreetLight position={[-4.2, 0, 6.2]} rotation={0} />

      {/* ---- lighting ---- */}
      <hemisphereLight args={dark ? ['#8fc4ff', '#0a0f1e', 0.55] : ['#dbe9ff', '#6b7890', 0.85]} />
      <directionalLight
        position={[9, 14, 7]}
        intensity={dark ? 2.4 : 2.6}
        color={dark ? '#ffe9d2' : '#fff4e6'}
        castShadow
        shadow-mapSize={lite ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-10, 6, -8]} intensity={dark ? 0.9 : 0.6} color={dark ? '#35d6ff' : '#bfe0ff'} />
      {/* studio-style environment map (no external HDR needed) */}
      <DreiEnv key={dark ? 'night' : 'day'} resolution={256} frames={1}>
        <Lightformer form="rect" intensity={dark ? 3 : 5} color={dark ? '#dfe9ff' : '#ffffff'} position={[0, 8, -4]} scale={[14, 6, 1]} target={[0, 0, 0]} />
        {!dark && <Lightformer form="rect" intensity={2.5} color="#eaf2ff" position={[0, 2, 10]} scale={[16, 8, 1]} target={[0, 0, 0]} />}
        <Lightformer form="rect" intensity={1.6} color="#35d6ff" position={[-9, 3, 4]} scale={[6, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#ffb070" position={[9, 2, 6]} scale={[5, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={0.8} color="#4f8cff" position={[0, -6, 0]} scale={10} target={[0, 0, 0]} />
      </DreiEnv>
      <ContactShadows key={dark ? 'cs-n' : 'cs-d'} position={[0, 0.005, 0]} opacity={dark ? 0.65 : 0.45} scale={24} blur={2.4} far={5} resolution={lite ? 256 : 512} frames={1} color="#000814" />

      {!lite && dark && <Sparkles count={60} scale={[22, 9, 22]} position={[0, 4.5, 0]} size={0.9} speed={0.2} color="#8fd9ff" opacity={0.4} />}
    </group>
  )
}
