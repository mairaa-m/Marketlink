import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Float, Lightformer } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function Tomato({ position, scale = 1, color = '#dc4937' }) {
  return (
    <Float speed={1.25} rotationIntensity={0.22} floatIntensity={0.32}>
      <group position={position} scale={scale}>
        <mesh castShadow scale={[1, 0.84, 1]}>
          <sphereGeometry args={[1, 40, 28]} />
          <meshPhysicalMaterial color={color} roughness={0.38} clearcoat={0.26} />
        </mesh>
        <group position={[0, 0.78, 0]}>
          {[0, 1, 2, 3, 4].map((leaf) => (
            <mesh key={leaf} rotation={[0, leaf * Math.PI * 0.4, -0.55]} castShadow>
              <coneGeometry args={[0.22, 0.76, 5]} />
              <meshStandardMaterial color="#3f713e" roughness={0.86} />
            </mesh>
          ))}
        </group>
      </group>
    </Float>
  )
}

function Carrot({ position, rotation, color = '#ee8038' }) {
  return (
    <Float speed={1.05} rotationIntensity={0.17} floatIntensity={0.26}>
      <group position={position} rotation={rotation}>
        <mesh castShadow><coneGeometry args={[0.42, 2.7, 32]} /><meshPhysicalMaterial color={color} roughness={0.65} /></mesh>
        <group position={[0, 1.55, 0]}>
          {[-0.25, 0, 0.25].map((x, index) => (
            <mesh key={x} position={[x, 0.48, 0]} rotation={[0, 0, x * 1.8]} castShadow>
              <capsuleGeometry args={[0.09, 1, 5, 10]} /><meshStandardMaterial color={index === 1 ? '#477f3f' : '#579449'} roughness={0.9} />
            </mesh>
          ))}
        </group>
      </group>
    </Float>
  )
}

function Lemon({ position }) {
  return (
    <Float speed={1.65} rotationIntensity={0.32} floatIntensity={0.42}>
      <mesh castShadow position={position} scale={[1.15, 0.82, 0.82]} rotation={[0.3, 0.15, -0.2]}>
        <sphereGeometry args={[0.72, 36, 24]} /><meshPhysicalMaterial color="#f1bd3d" roughness={0.56} clearcoat={0.08} />
      </mesh>
    </Float>
  )
}

function Crate() {
  const slats = useMemo(() => [-1.65, -0.83, 0, 0.83, 1.65], [])
  return (
    <group position={[0.5, -1.8, -0.1]} rotation={[0.06, -0.24, -0.03]}>
      <mesh receiveShadow position={[0, -0.18, 0]}><boxGeometry args={[4.8, 0.18, 3]} /><meshStandardMaterial color="#865932" roughness={0.92} /></mesh>
      {slats.map((x) => <mesh key={x} position={[x, 0.52, 1.47]} castShadow><boxGeometry args={[0.7, 1.35, 0.16]} /><meshStandardMaterial color="#a76d3c" roughness={0.88} /></mesh>)}
      {[-1.42, 1.42].map((z) => <mesh key={z} position={[2.3, 0.52, z]} castShadow><boxGeometry args={[0.16, 1.35, 0.6]} /><meshStandardMaterial color="#946039" roughness={0.9} /></mesh>)}
    </group>
  )
}

function PointerRig() {
  const group = useRef(null)
  const { pointer } = useThree()
  useFrame((state, rawDelta) => {
    if (!group.current) return
    const ease = 1 - Math.exp(-2.8 * Math.min(rawDelta, 0.05))
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.12, ease)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointer.y * -0.07, ease)
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.04
  })
  return (
    <group ref={group}>
      <Crate />
      <Tomato position={[-0.8, -0.65, 0.6]} scale={1.05} />
      <Tomato position={[1.05, -0.8, 0.45]} scale={0.82} color="#c93a31" />
      <Tomato position={[0.15, 0.05, -0.05]} scale={1.25} />
      <Carrot position={[2.4, -0.15, -0.5]} rotation={[0.1, 0.1, -0.48]} />
      <Carrot position={[2.95, -0.4, -0.9]} rotation={[-0.1, 0.2, -0.58]} color="#d86536" />
      <Lemon position={[-2.15, -0.1, 0.1]} />
      <Lemon position={[-2.8, -0.7, -0.5]} />
    </group>
  )
}

export default function ProduceScene() {
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.1, 10.5], fov: 39 }} gl={{ antialias: true, alpha: true }} aria-label="Interactive three-dimensional basket of fresh produce">
      <ambientLight intensity={0.8} />
      <directionalLight position={[-4, 8, 7]} intensity={3.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[5, 3, 4]} intensity={18} color="#ffd18a" />
      <Environment><Lightformer intensity={2.8} position={[0, 5, 1]} scale={[8, 8, 1]} /><Lightformer intensity={1.2} color="#bdd6ac" position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} /></Environment>
      <PointerRig />
      <ContactShadows position={[0, -2.05, 0]} opacity={0.42} scale={12} blur={2.5} far={5} />
    </Canvas>
  )
}
