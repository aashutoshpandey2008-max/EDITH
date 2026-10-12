import { RoundedBox } from '@react-three/drei'
import { CONFIG } from '../../config/robotConfig'
import { COL } from './materials'

const { length: L, width: Wd, height: H, clearance: C } = CONFIG.chassis
const emissive = (c, i = 2) => <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} />

export default function RobotBase() {
  const bolts = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2)
  return (
    <group>
      <RoundedBox args={[Wd, H, L]} radius={0.02} smoothness={3} position={[0, C + H / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={COL.chassis} metalness={0.85} roughness={0.38} />
      </RoundedBox>
      <RoundedBox args={[Wd - 0.03, 0.012, L - 0.04]} radius={0.004} position={[0, C + H + 0.006, 0]} castShadow>
        <meshStandardMaterial color={COL.panel} metalness={0.9} roughness={0.3} />
      </RoundedBox>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (Wd / 2 + 0.001), C + H / 2, 0]}><boxGeometry args={[0.004, 0.012, L - 0.08]} />{emissive(COL.cyan)}</mesh>
      ))}
      <mesh position={[0, C + 0.002, 0]}><boxGeometry args={[Wd - 0.06, 0.004, L - 0.1]} />{emissive(COL.cyan, 1.5)}</mesh>
      <pointLight position={[0, 0.03, 0]} color={COL.cyan} intensity={0.5} distance={0.8} />
      {/* bumpers */}
      <RoundedBox args={[Wd + 0.02, 0.04, 0.025]} radius={0.01} position={[0, 0.085, L / 2 + 0.012]} castShadow><meshStandardMaterial color={COL.dark} metalness={0.7} roughness={0.5} /></RoundedBox>
      <RoundedBox args={[Wd + 0.02, 0.04, 0.025]} radius={0.01} position={[0, 0.085, -L / 2 - 0.012]}><meshStandardMaterial color={COL.dark} metalness={0.7} roughness={0.5} /></RoundedBox>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.11, 0.12, L / 2 + 0.026]}><boxGeometry args={[0.04, 0.012, 0.006]} />{emissive('#e0f2fe', 3)}</mesh>
          <mesh position={[s * 0.11, 0.12, -L / 2 - 0.026]}><boxGeometry args={[0.04, 0.012, 0.006]} />{emissive(COL.red, 2)}</mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[s * (Wd / 2 + 0.002), 0.1, -0.1 + i * 0.05]}><boxGeometry args={[0.004, 0.03, 0.025]} /><meshStandardMaterial color="#05070b" /></mesh>
          ))}
        </group>
      ))}
      {/* slewing ring under the arm */}
      <mesh position={[0, C + H + 0.02, 0]} castShadow><cylinderGeometry args={[0.125, 0.135, 0.03, 48]} /><meshStandardMaterial color={COL.metal} metalness={0.9} roughness={0.3} /></mesh>
      {bolts.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.115, C + H + 0.037, Math.cos(a) * 0.115]}><cylinderGeometry args={[0.006, 0.006, 0.006, 6]} /><meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.3} /></mesh>
      ))}
    </group>
  )
}
