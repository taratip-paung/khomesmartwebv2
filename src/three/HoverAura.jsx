import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Hover aura: a soft column of light rising around a zone (additive, scrolling
 * bands fading toward the top), a pulsing ring at the base and rising sparks.
 * `active` fades it in/out smoothly — nothing is rendered when fully faded.
 */
const columnVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`
const columnFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    // vertical fade: strong at the base, gone at the top
    float vert = pow(1.0 - vUv.y, 1.6);
    // bands scrolling upward
    float b1 = smoothstep(0.35, 0.65, sin((vUv.y * 6.0 - uTime * 1.1) * 6.2831) * 0.5 + 0.5);
    float b2 = smoothstep(0.4, 0.7, sin((vUv.y * 2.5 - uTime * 0.6 + vUv.x * 2.0) * 6.2831) * 0.5 + 0.5);
    // thin vertical streaks
    float streak = smoothstep(0.75, 1.0, hash(vec2(floor(vUv.x * 48.0), 0.0)) ) * smoothstep(0.3, 0.9, fract(vUv.y * 1.0 - uTime * 0.5 + hash(vec2(floor(vUv.x * 48.0), 1.0))));
    // fresnel-ish edge so the column reads as a volume
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 1.5);
    float a = vert * (0.08 + 0.16 * b1 + 0.12 * b2 + 0.45 * streak) * (0.35 + 0.65 * fres);
    gl_FragColor = vec4(uColor * (1.2 + 0.8 * streak), a * uOpacity);
  }
`
const sparkVert = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uHeight;
  varying float vFade;
  void main() {
    float t = fract(uTime * (0.18 + aSeed * 0.22) + aSeed * 7.0);
    vec3 p = position;
    p.y = t * uHeight;
    p.x += sin(uTime * 2.0 + aSeed * 20.0) * 0.08;
    p.z += cos(uTime * 1.7 + aSeed * 13.0) * 0.08;
    vFade = sin(t * 3.14159);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.2 + aSeed * 2.2) * (26.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const sparkFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vFade * uOpacity;
    gl_FragColor = vec4(uColor * 1.6, a);
  }
`

export default function HoverAura({ active, position, radius, height, color = '#35d6ff' }) {
  const colMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: columnVert,
        fragmentShader: columnFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [color],
  )
  const sparkMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uOpacity: { value: 0 }, uHeight: { value: height } },
        vertexShader: sparkVert,
        fragmentShader: sparkFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color, height],
  )
  const sparks = useMemo(() => {
    const n = 48
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const r = radius * (0.55 + Math.random() * 0.5)
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 0
      pos[i * 3 + 2] = Math.sin(a) * r
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [radius])
  const ringMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }),
    [color],
  )
  const group = useRef()
  const k = useRef(0)

  useFrame(({ clock }, dt) => {
    const target = active ? 1 : 0
    k.current += (target - k.current) * Math.min(1, dt * (active ? 6 : 3))
    const v = k.current
    if (group.current) group.current.visible = v > 0.01
    const t = clock.elapsedTime
    colMat.uniforms.uTime.value = t
    colMat.uniforms.uOpacity.value = v
    sparkMat.uniforms.uTime.value = t
    sparkMat.uniforms.uOpacity.value = v
    ringMat.opacity = v * (0.4 + Math.sin(t * 3.0) * 0.15)
  })

  return (
    <group ref={group} position={position} visible={false}>
      <mesh material={colMat} raycast={() => null}>
        <cylinderGeometry args={[radius * 0.98, radius * 1.02, height, 48, 1, true]} />
      </mesh>
      <points geometry={sparks} material={sparkMat} position={[0, -height / 2, 0]} raycast={() => null} />
      <mesh material={ringMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -height / 2 + 0.02, 0]} raycast={() => null}>
        <ringGeometry args={[radius * 0.96, radius * 1.08, 64]} />
      </mesh>
    </group>
  )
}
