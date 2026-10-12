import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { CONFIG } from '../../config/robotConfig'
import { S } from '../../sim/state'
import { useUI } from '../../store/uiStore'
import { rig } from '../../vision/feedRegistry'
import { COL } from './materials'
import Overlay from './Overlay'

const cam = CONFIG.camera
const rad = (d) => (d * Math.PI) / 180

function Lens({ x, markerKey }) {
  const marker = useRef()
  useEffect(() => { rig[markerKey] = marker.current; return () => { rig[markerKey] = null } }, [markerKey])
  const show = useUI((s) => s.showFov)
  const frustum = useMemo(() => {
    const d = 1.2, hw = d * Math.tan(rad(cam.hfov / 2)), hh = d * Math.tan(rad(cam.vfov / 2))
    const c = [[-hw, hh], [hw, hh], [hw, -hh], [-hw, -hh]].map(([a, b]) => [a, b, d])
    const pts = []
    c.forEach((p, i) => { pts.push(0, 0, 0, ...p); const q = c[(i + 1) % 4]; pts.push(...p, ...q) })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
  return (
    <group position={[x, 0, 0.035]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.004]}><cylinderGeometry args={[0.024, 0.024, 0.03, 32]} /><meshStandardMaterial color="#111827" metalness={0.9} roughness={0.3} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}><torusGeometry args={[0.022, 0.004, 12, 32]} /><meshStandardMaterial color={COL.metal} metalness={1} roughness={0.2} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.022]}><cylinderGeometry args={[0.017, 0.017, 0.004, 32]} /><meshStandardMaterial color="#020617" metalness={1} roughness={0.05} /></mesh>
      <mesh position={[0, 0, 0.0245]}><sphereGeometry args={[0.014, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshPhysicalMaterial color="#1e1b4b" metalness={0.6} roughness={0.05} clearcoat={1} emissive="#3b82f6" emissiveIntensity={0.25} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.023]}><torusGeometry args={[0.009, 0.0015, 8, 24]} /><meshStandardMaterial color={COL.cyan} emissive={COL.cyan} emissiveIntensity={2} /></mesh>
      <object3D ref={marker} position={[0, 0, 0.03]} />
      <Overlay visible={show}>
        <lineSegments geometry={frustum} position={[0, 0, 0.03]}><lineBasicMaterial color="#38bdf8" transparent opacity={0.55} /></lineSegments>
      </Overlay>
    </group>
  )
}

export default function CameraHead() {
  const pan = useRef(), tilt = useRef()
  useFrame(() => { pan.current.rotation.y = rad(S.head.pan); tilt.current.rotation.x = -rad(S.head.tilt) })
  const h = cam.head
  return (
    <group>
      <mesh position={[h.x, 0.275, h.z]} castShadow><cylinderGeometry args={[0.016, 0.02, 0.25, 16]} /><meshStandardMaterial color={COL.panel} metalness={0.9} roughness={0.3} /></mesh>
      <mesh position={[h.x, 0.4, h.z]}><cylinderGeometry args={[0.03, 0.03, 0.012, 24]} /><meshStandardMaterial color={COL.metal} metalness={1} roughness={0.3} /></mesh>
      <group ref={pan} position={[h.x, h.y - 0.012, h.z]}>
        <group ref={tilt} position={[0, 0.012, 0]}>
          <RoundedBox args={[0.19, 0.06, 0.07]} radius={0.012} smoothness={3} castShadow><meshStandardMaterial color={COL.chassis} metalness={0.85} roughness={0.35} /></RoundedBox>
          <mesh position={[0, 0.0305, 0]}><boxGeometry args={[0.15, 0.003, 0.05]} /><meshStandardMaterial color={COL.cyan} emissive={COL.cyan} emissiveIntensity={1.8} /></mesh>
          <Lens x={-cam.lensSeparation / 2} markerKey="lensR" />
          <Lens x={cam.lensSeparation / 2} markerKey="lensL" />
        </group>
      </group>
    </group>
  )
}
