import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from '../../config/robotConfig'
import { S } from '../../sim/state'
import Overlay from './Overlay'

export default function IRSensorArray() {
  const { spots, forwardOffset: fz, height: h } = CONFIG.irSensors
  const spotMat = useRef([]), beamMat = useRef([])
  useFrame(() => {
    S.ir.forEach((s, i) => {
      spotMat.current[i]?.color.set(s.onLine ? '#22d3ee' : '#475569')
      beamMat.current[i]?.color.set(s.onLine ? '#22d3ee' : '#1e3a5f')
    })
  })
  return (
    <group>
      <mesh position={[0, 0.047, fz]}><boxGeometry args={[0.3, 0.006, 0.026]} /><meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.4} /></mesh>
      {[-0.15, 0.15].map((x) => <mesh key={x} position={[x, 0.052, fz - 0.01]}><boxGeometry args={[0.01, 0.012, 0.012]} /><meshStandardMaterial color="#1f2937" /></mesh>)}
      {spots.map((sp, i) => (
        <group key={sp.name} position={[sp.x, 0, fz]}>
          <mesh position={[0, h + 0.006, 0]}><boxGeometry args={[0.032, 0.008, 0.022]} /><meshStandardMaterial color="#1d4ed8" metalness={0.3} roughness={0.5} /></mesh>
          {[-0.007, 0.007].map((dx) => <mesh key={dx} position={[dx, h - 0.001, 0]}><cylinderGeometry args={[0.004, 0.004, 0.008, 10]} /><meshStandardMaterial color={dx < 0 ? '#e5e7eb' : '#111827'} /></mesh>)}
          <Overlay>
            <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[0.004, 0.012, h, 12, 1, true]} /><meshBasicMaterial ref={(m) => (beamMat.current[i] = m)} color="#1e3a5f" transparent opacity={0.5} side={2} /></mesh>
            <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.014, 20]} /><meshBasicMaterial ref={(m) => (spotMat.current[i] = m)} color="#475569" /></mesh>
          </Overlay>
        </group>
      ))}
    </group>
  )
}
