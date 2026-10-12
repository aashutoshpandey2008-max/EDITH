import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { S } from '../../sim/state'
import { COL } from './materials'

export default function SpeakerModule() {
  const ring = useRef()
  useFrame(({ clock }) => { ring.current.emissiveIntensity = S.speaking ? 1.5 + Math.sin(clock.elapsedTime * 14) * 1.2 : 0.3 })
  return (
    <group position={[-0.09, 0.168, -0.19]} rotation={[-0.35, 0, 0]}>
      <mesh castShadow><cylinderGeometry args={[0.05, 0.055, 0.03, 32]} /><meshStandardMaterial color="#0b0f17" metalness={0.7} roughness={0.5} /></mesh>
      <mesh position={[0, 0.0165, 0]}><cylinderGeometry args={[0.04, 0.04, 0.002, 32]} /><meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.8} /></mesh>
      {[0.012, 0.022, 0.032].map((r) => (
        <mesh key={r} position={[0, 0.0182, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.0012, 6, 28]} /><meshStandardMaterial color="#64748b" metalness={1} roughness={0.3} /></mesh>
      ))}
      <mesh position={[0, 0.016, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.048, 0.003, 8, 36]} /><meshStandardMaterial ref={ring} color={COL.cyan} emissive={COL.cyan} emissiveIntensity={0.3} /></mesh>
    </group>
  )
}
