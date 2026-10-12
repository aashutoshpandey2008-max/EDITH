import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { S } from '../../sim/state'
import { gripWidth } from '../../sim/arm'
import { COL } from './materials'

// Parallel-jaw gripper that hangs vertically below the wrist. Pad centre is 0.12 m below the wrist axle.
export default function Gripper() {
  const l = useRef(), r = useRef()
  useFrame(() => {
    const w = gripWidth(S.arm.grip)
    l.current.position.x = w / 2 + 0.006
    r.current.position.x = -(w / 2 + 0.006)
  })
  const metal = <meshStandardMaterial color={COL.metal} metalness={0.9} roughness={0.35} />
  return (
    <group>
      <mesh position={[0, -0.03, 0]} castShadow><boxGeometry args={[0.09, 0.034, 0.05]} />{metal}</mesh>
      <mesh position={[0, -0.055, 0]}><boxGeometry args={[0.06, 0.02, 0.042]} /><meshStandardMaterial color={COL.chassis} metalness={0.8} roughness={0.4} /></mesh>
      <mesh position={[0, -0.056, 0.0215]}><boxGeometry args={[0.04, 0.006, 0.002]} /><meshStandardMaterial color={COL.cyan} emissive={COL.cyan} emissiveIntensity={2} /></mesh>
      <mesh position={[0, -0.067, 0]}><boxGeometry args={[0.22, 0.008, 0.012]} />{metal}</mesh>
      {[[l, 1], [r, -1]].map(([ref, s]) => (
        <group key={s} ref={ref}>
          <mesh position={[0, -0.09, 0]} castShadow><boxGeometry args={[0.012, 0.05, 0.035]} /><meshStandardMaterial color="#334155" metalness={0.85} roughness={0.35} /></mesh>
          <mesh position={[0, -0.12, 0]} castShadow><boxGeometry args={[0.012, 0.07, 0.035]} /><meshStandardMaterial color="#334155" metalness={0.85} roughness={0.35} /></mesh>
          <mesh position={[-s * 0.0068, -0.12, 0]}><boxGeometry args={[0.003, 0.055, 0.03]} /><meshStandardMaterial color={COL.cyan} emissive={COL.cyan} emissiveIntensity={0.9} /></mesh>
        </group>
      ))}
    </group>
  )
}
