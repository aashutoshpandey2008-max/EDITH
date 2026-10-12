import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from '../../config/robotConfig'
import { S } from '../../sim/state'
import { COL } from './materials'

export default function WheelAssembly({ position, side }) {
  const spin = useRef()
  const { radius: R, width: Wd } = CONFIG.wheel
  useFrame(() => { spin.current.rotation.x = S.wheels[side] })
  const treads = useMemo(() => Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2), [])
  return (
    <group position={position}>
      <group ref={spin}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[R, R, Wd, 32]} /><meshStandardMaterial color="#0a0c10" roughness={0.9} metalness={0.1} /></mesh>
        {treads.map((a, i) => (
          <mesh key={i} position={[0, Math.sin(a) * R, Math.cos(a) * R]} rotation={[-a, 0, 0]}><boxGeometry args={[Wd * 0.98, 0.012, 0.03]} /><meshStandardMaterial color="#05070a" roughness={1} /></mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.048, 0.048, Wd + 0.004, 24]} /><meshStandardMaterial color={COL.metal} metalness={0.9} roughness={0.3} /></mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[(i * Math.PI) / 5, 0, 0]}><boxGeometry args={[Wd + 0.006, 0.092, 0.011]} /><meshStandardMaterial color="#2a3446" metalness={0.8} roughness={0.4} /></mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.017, 0.017, Wd + 0.014, 20]} /><meshStandardMaterial color={COL.cyan} emissive={COL.cyan} emissiveIntensity={1.5} /></mesh>
      </group>
    </group>
  )
}
