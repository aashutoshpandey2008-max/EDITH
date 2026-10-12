import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useUI } from '../../store/uiStore'
import { COL } from './materials'

export default function MicrophoneModule() {
  const ring = useRef()
  useFrame(({ clock }) => {
    const on = useUI.getState().listening
    ring.current.emissiveIntensity = on ? 1.5 + Math.sin(clock.elapsedTime * 8) : 0.4
    ring.current.color.set(on ? '#22c55e' : COL.cyan); ring.current.emissive.set(on ? '#22c55e' : COL.cyan)
  })
  return (
    <group position={[0.075, 0.31, 0.17]}>
      <mesh><cylinderGeometry args={[0.006, 0.006, 0.12, 10]} /><meshStandardMaterial color={COL.panel} metalness={0.8} /></mesh>
      <group position={[0, 0.07, 0]}>
        <mesh castShadow><capsuleGeometry args={[0.014, 0.03, 6, 16]} /><meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.5} /></mesh>
        <mesh><torusGeometry args={[0.0145, 0.002, 8, 20]} /><meshStandardMaterial ref={ring} color={COL.cyan} emissive={COL.cyan} emissiveIntensity={0.4} /></mesh>
      </group>
    </group>
  )
}
