import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CONFIG } from '../../config/robotConfig'
import { S } from '../../sim/state'
import { rad } from '../../sim/arm'
import { COL } from './materials'
import Gripper from './Gripper'

const A = CONFIG.arm
const PIVOT = A.baseHeight - CONFIG.chassis.deckHeight // hinge height above the deck
const metal = (c = COL.chassis) => <meshStandardMaterial color={c} metalness={0.85} roughness={0.38} />
const glow = (i = 2) => <meshStandardMaterial color={COL.cyan} emissive={COL.cyan} emissiveIntensity={i} />

export default function CraneArm() {
  const turret = useRef(), boom = useRef(), inner = useRef(), wrist = useRef(), level = useRef(), barrel = useRef(), rod = useRef()
  const t = useMemo(() => ({ P: new THREE.Vector3(), Q: new THREE.Vector3(), d: new THREE.Vector3(), q: new THREE.Quaternion(), y: new THREE.Vector3(0, 1, 0) }), [])

  useFrame(() => {
    const a = S.arm, al = rad(a.boom)
    turret.current.rotation.y = rad(a.yaw)
    boom.current.rotation.x = -al
    inner.current.position.z = 0.3 + a.ext
    wrist.current.position.z = A.boomLength + a.ext
    level.current.rotation.x = al // keeps the gripper hanging vertically
    // hydraulic lift cylinder: turret mount → boom lug (both in the turret frame)
    const { P, Q, d, q, y } = t
    P.set(0, 0.06, -0.075)
    Q.set(0, PIVOT + (-0.045 * Math.cos(al) + 0.2 * Math.sin(al)), 0.045 * Math.sin(al) + 0.2 * Math.cos(al))
    d.subVectors(Q, P); const len = d.length(); d.normalize(); q.setFromUnitVectors(y, d)
    barrel.current.position.copy(P).addScaledVector(d, len * 0.275); barrel.current.scale.y = len * 0.55; barrel.current.quaternion.copy(q)
    rod.current.position.copy(P).addScaledVector(d, len * 0.775); rod.current.scale.y = len * 0.45; rod.current.quaternion.copy(q)
  })

  return (
    <group position={[0, CONFIG.chassis.deckHeight, 0]}>
      <group ref={turret}>
        <mesh position={[0, 0.045, 0]} castShadow><cylinderGeometry args={[0.105, 0.105, 0.03, 40]} />{metal('#1b2638')}</mesh>
        <mesh position={[0, 0.0635, 0]}><cylinderGeometry args={[0.108, 0.108, 0.006, 40]} />{glow(1.6)}</mesh>
        <mesh position={[0, 0.1, 0]} castShadow><cylinderGeometry args={[0.07, 0.08, 0.07, 32]} />{metal()}</mesh>
        {/* yoke plates + hinge */}
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.055, 0.12, 0]} castShadow><boxGeometry args={[0.02, 0.12, 0.12]} />{metal('#223048')}</mesh>)}
        <mesh position={[0, PIVOT, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.014, 0.014, 0.17, 16]} /><meshStandardMaterial color={COL.metal} metalness={1} roughness={0.25} /></mesh>
        <mesh position={[0.097, PIVOT, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.032, 0.032, 0.05, 24]} /><meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} /></mesh>
        <mesh position={[0.124, PIVOT, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.024, 0.024, 0.006, 24]} />{glow(2)}</mesh>
        {/* slew motor + counterweight */}
        <mesh position={[-0.085, 0.085, 0.04]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.08, 20]} /><meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} /></mesh>
        <mesh position={[-0.085, 0.127, 0.04]}><cylinderGeometry args={[0.022, 0.022, 0.006, 20]} />{glow(2)}</mesh>
        <mesh position={[0, 0.075, -0.09]} castShadow><boxGeometry args={[0.1, 0.08, 0.07]} />{metal('#0e1522')}</mesh>
        <mesh position={[0, 0.06, -0.075]}><boxGeometry args={[0.03, 0.03, 0.02]} />{metal(COL.metal)}</mesh>
        {/* hydraulic cylinder */}
        <mesh ref={barrel}><cylinderGeometry args={[0.014, 0.014, 1, 12]} /><meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} /></mesh>
        <mesh ref={rod}><cylinderGeometry args={[0.007, 0.007, 1, 10]} /><meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.15} /></mesh>

        {/* boom */}
        <group ref={boom} position={[0, PIVOT, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.09, 20]} />{metal('#2b3a52')}</mesh>
          <mesh position={[0, 0, 0.21]} castShadow><boxGeometry args={[0.07, 0.07, 0.5]} />{metal('#1b2638')}</mesh>
          {[-1, 1].map((s) => <mesh key={s} position={[s * 0.0355, 0, 0.2]}><boxGeometry args={[0.004, 0.014, 0.38]} />{glow(1.6)}</mesh>)}
          <mesh position={[0, 0, 0.455]}><boxGeometry args={[0.082, 0.082, 0.02]} />{metal(COL.metal)}</mesh>
          <mesh position={[0, -0.045, 0.2]}><boxGeometry args={[0.03, 0.025, 0.03]} />{metal(COL.metal)}</mesh>
          <mesh ref={inner} position={[0, 0, 0.3]} castShadow><boxGeometry args={[0.05, 0.05, 0.5]} /><meshStandardMaterial color="#8fa0b8" metalness={0.9} roughness={0.3} /></mesh>
          <group ref={wrist} position={[0, 0, A.boomLength]}>
            <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.022, 0.022, 0.07, 20]} />{metal('#0f172a')}</mesh>
            <mesh position={[0.038, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.016, 0.016, 0.006, 16]} />{glow(2)}</mesh>
            <group ref={level}><Gripper /></group>
          </group>
        </group>
      </group>
    </group>
  )
}
