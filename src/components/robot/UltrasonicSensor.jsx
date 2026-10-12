import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from '../../config/robotConfig'
import { S } from '../../sim/state'
import { useUI } from '../../store/uiStore'
import Overlay from './Overlay'

const half = (CONFIG.ultrasonic.coneDeg / 2) * (Math.PI / 180)

export default function UltrasonicSensor({ id }) {
  const c = CONFIG.ultrasonic.sensors[id]
  const cone = useRef(), mat = useRef()
  const show = useUI((s) => s.showCones)
  useFrame(() => {
    if (!cone.current) return
    const d = S.us[id], u = useUI.getState()
    const len = Math.min(d, 1.5)
    cone.current.scale.set(len, len, len)
    cone.current.position.z = len / 2
    mat.current.color.set(d < u.stopDist ? '#ef4444' : d < u.slowDist ? '#f59e0b' : '#22d3ee')
  })
  return (
    <group position={[c.x, c.y, c.z]} rotation={[0, (c.yaw * Math.PI) / 180, 0]}>
      <mesh castShadow><boxGeometry args={[0.05, 0.024, 0.016]} /><meshStandardMaterial color="#111827" metalness={0.5} roughness={0.5} /></mesh>
      {[-0.014, 0.014].map((x) => (
        <group key={x} position={[x, 0, 0.008]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.009, 0.009, 0.012, 20]} /><meshStandardMaterial color="#9ca3af" metalness={1} roughness={0.25} /></mesh>
          <mesh position={[0, 0, 0.0065]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.0065, 0.0065, 0.002, 20]} /><meshStandardMaterial color="#020617" /></mesh>
        </group>
      ))}
      <Overlay visible={show}>
        <mesh ref={cone} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <coneGeometry args={[Math.tan(half), 1, 24, 1, true]} />
          <meshBasicMaterial ref={mat} color="#22d3ee" transparent opacity={0.16} side={2} depthWrite={false} />
        </mesh>
      </Overlay>
    </group>
  )
}
