import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges, Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { W, TRACK, TRACK_DEF, ZONES, ARENA } from '../sim/world'
import { useUI } from '../store/uiStore'

function ribbon(points, width, closed) {
  const n = points.length, pos = [], idx = []
  for (let i = 0; i < n; i++) {
    const p = points[i], a = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]
    let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l
    const nx = tz * (width / 2), nz = -tx * (width / 2)
    pos.push(p.x + nx, 0.003, p.z + nz, p.x - nx, 0.003, p.z - nz)
  }
  const segs = closed ? n : n - 1
  for (let i = 0; i < segs; i++) { const a = i * 2, b = ((i + 1) % n) * 2; idx.push(a, a + 1, b, a + 1, b + 1, b) }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals()
  return g
}

function Track() {
  const [loop, chord] = useMemo(() => [ribbon(TRACK.loop, TRACK_DEF.width, true), ribbon(TRACK.chord, TRACK_DEF.width, false)], [])
  return <group>
    <mesh geometry={loop} receiveShadow><meshStandardMaterial color="#05060a" roughness={0.9} side={2} /></mesh>
    <mesh geometry={chord} receiveShadow><meshStandardMaterial color="#05060a" roughness={0.9} side={2} /></mesh>
  </group>
}

function Zone({ zn, color, label }) {
  return <group position={[zn.x, 0.0015, zn.z]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[zn.w, zn.d]} /><meshStandardMaterial color={color} roughness={0.8} transparent opacity={0.85} /></mesh>
    <lineSegments rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
      <edgesGeometry args={[new THREE.PlaneGeometry(zn.w, zn.d)]} /><lineBasicMaterial color="#e2e8f0" />
    </lineSegments>
    <Html position={[0, 0.02, -zn.d / 2 + 0.1]} center distanceFactor={7} style={{ pointerEvents: 'none' }}>
      <div className="text-[10px] tracking-widest text-white/80 mono whitespace-nowrap">{label}</div>
    </Html>
  </group>
}

function WallMesh({ o }) {
  if (o.kind === 'station') return <group position={[o.x, 0, o.z]}>
    <RoundedBox args={[o.w, o.h, o.d]} radius={0.02} position={[0, o.h / 2, 0]} castShadow><meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} /></RoundedBox>
    <mesh position={[-o.w / 2 - 0.002, o.h / 2, 0]}><boxGeometry args={[0.006, 0.25, 0.3]} /><meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} /></mesh>
  </group>
  return <mesh position={[o.x, o.y, o.z]} castShadow receiveShadow><boxGeometry args={[o.w, o.h, o.d]} /><meshStandardMaterial color="#334155" metalness={0.5} roughness={0.6} /></mesh>
}

function ObstacleMesh({ o }) {
  if (o.kind === 'person') return <group position={[o.x, 0, o.z]}>
    <mesh position={[0, 0.4, 0]} castShadow><capsuleGeometry args={[0.15, 0.55, 6, 16]} /><meshStandardMaterial color="#059669" roughness={0.6} /></mesh>
    <mesh position={[0, 0.88, 0]} castShadow><sphereGeometry args={[0.1, 20, 16]} /><meshStandardMaterial color="#fcd9b6" roughness={0.7} /></mesh>
    <mesh position={[0, 0.5, 0.151]}><boxGeometry args={[0.2, 0.03, 0.003]} /><meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.8} /></mesh>
  </group>
  if (o.type === 'cyl') return <group position={[o.x, 0, o.z]}>
    <mesh position={[0, o.h / 2, 0]} castShadow><cylinderGeometry args={[o.r, o.r, o.h, 28]} /><meshStandardMaterial color={o.color} roughness={0.5} /></mesh>
    <mesh position={[0, o.h * 0.7, 0]}><cylinderGeometry args={[o.r + 0.002, o.r + 0.002, 0.05, 28]} /><meshStandardMaterial color="#f8fafc" /></mesh>
  </group>
  return <mesh position={[o.x, o.y, o.z]} castShadow receiveShadow>
    <boxGeometry args={[o.w, o.h, o.d]} /><meshStandardMaterial color={o.color} roughness={0.55} metalness={0.2} /><Edges color="#fed7aa" />
  </mesh>
}

function CrateMesh({ b }) {
  const ref = useRef()
  useFrame(() => { ref.current.position.set(b.x, b.y, b.z) })
  return <mesh ref={ref} castShadow receiveShadow>
    <boxGeometry args={[b.size, b.size, b.size]} /><meshStandardMaterial color={b.color} roughness={0.5} metalness={0.3} /><Edges color={b.mass > 0.8 ? '#facc15' : '#ffffff'} />
  </mesh>
}

export default function Environment3D() {
  useUI((s) => s.worldVersion) // re-render when obstacles are added/removed or a scenario loads
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[ARENA.halfX * 2, ARENA.halfZ * 2]} /><meshStandardMaterial color="#8a94a0" roughness={0.85} metalness={0.05} /></mesh>
      <gridHelper args={[ARENA.halfX * 2, ARENA.halfX * 4, '#7b8693', '#7f8a97']} position={[0, 0.0008, 0]} />
      <Track />
      <Zone zn={ZONES.pickup} color="#166534" label="PICKUP AREA" />
      <Zone zn={ZONES.drop} color="#9a5b12" label="DROP-OFF AREA" />
      <Zone zn={ZONES.home} color="#1e3a8a" label="HOME / CHARGING" />
      {W.walls.map((o) => <WallMesh key={o.id} o={o} />)}
      {W.obstacles.map((o) => <ObstacleMesh key={o.id} o={o} />)}
      {W.boxes.map((b) => <CrateMesh key={b.id} b={b} />)}
    </group>
  )
}
