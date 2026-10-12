import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from '../../config/robotConfig'
import { S } from '../../sim/state'
import RobotBase from './RobotBase'
import WheelAssembly from './WheelAssembly'
import IRSensorArray from './IRSensorArray'
import UltrasonicSensor from './UltrasonicSensor'
import CameraHead from './CameraHead'
import MicrophoneModule from './MicrophoneModule'
import SpeakerModule from './SpeakerModule'
import CraneArm from './CraneArm'
import Labels, { DebugTag } from './Labels'

export default function Robot() {
  const g = useRef()
  useFrame(() => { g.current.position.set(S.pose.x, 0, S.pose.z); g.current.rotation.y = S.pose.th })
  const { radius, track, wheelbase } = CONFIG.wheel
  const wheels = [['l', 1, 1], ['l', 1, -1], ['r', -1, 1], ['r', -1, -1]]
  return (
    <group ref={g}>
      <RobotBase />
      {wheels.map(([side, sx, sz], i) => <WheelAssembly key={i} side={side} position={[(sx * track) / 2, radius, (sz * wheelbase) / 2]} />)}
      <IRSensorArray />
      <UltrasonicSensor id="front" /><UltrasonicSensor id="left" /><UltrasonicSensor id="right" />
      <CameraHead />
      <MicrophoneModule />
      <SpeakerModule />
      <CraneArm />
      <Labels />
      <DebugTag />
    </group>
  )
}
