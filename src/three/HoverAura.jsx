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
  precision highp float;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    // keep every input in a safe range — no large sin() arguments, no hash overflow
    // (the classic fract(sin(x)*43758.0) trick produces NaN on Apple/Metal GPUs and
    //  a NaN in an additive pass turns the bloom buffer black)
    float t = mod(uTime, 60.0);
    float y = clamp(vUv.y, 0.0, 1.0);
    float vert = (1.0 - y) * (1.0 - y);
    float b1 = smoothstep(0.35, 0.65, 0.5 + 0.5 * sin(6.2831 * fract(y * 6.0 - t * 1.1)));
    float b2 = smoothstep(0.4, 0.7, 0.5 + 0.5 * sin(6.2831 * fract(y * 2.5 - t * 0.6 + vUv.x * 2.0)));
    // vertical streaks: 40 columns, ~1 in 4 lit, each with its own phase
    float col = floor(vUv.x * 40.0);
    float lit = step(0.72, fract(col * 0.6180339));
    float phase = fract(col * 0.3819660);
    float streak = lit * smoothstep(0.3, 0.9, fract(y - t * 0.5 + phase));
    vec3 n = normalize(vNormalW + vec3(0.0001));
    vec3 v = normalize(vViewDir + vec3(0.0001));
    float fres = 1.0 - abs(dot(n, v));
    fres = fres * fres;
    float a = vert * (0.08 + 0.16 * b1 + 0.12 * b2 + 0.45 * streak) * (0.35 + 0.65 * fres);
    a = clamp(a * uOpacity, 0.0, 1.0);
    gl_FragColor = vec4(uColor * (1.2 + 0.8 * streak) * a, a);
  }
`
const sparkVert = /* glsl */ `
  precision highp float;
  attribute float aSeed;
  uniform float uTime;
  uniform float uHeight;
  varying float vFade;
  void main() {
    float tt = mod(uTime, 60.0);
    float t = fract(tt * (0.18 + aSeed * 0.22) + aSeed * 7.0);
    vec3 p = position;
    p.y = t * uHeight;
    p.x += sin(6.2831 * fract(tt * 0.32 + aSeed)) * 0.08;
    p.z += cos(6.2831 * fract(tt * 0.27 + aSeed * 0.5)) * 0.08;
    vFade = sin(t * 3.14159);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp((1.2 + aSeed * 2.2) * (26.0 / max(0.5, -mv.z)), 1.0, 24.0);
    gl_Position = projectionMatrix * mv;
  }
`
const sparkFrag = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = clamp(smoothstep(0.5, 0.05, d) * vFade * uOpacity, 0.0, 1.0);
    gl_FragColor = vec4(uColor * 1.6 * a, a);
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
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendEquation: THREE.AddEquation,
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
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendEquation: THREE.AddEquation,
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
