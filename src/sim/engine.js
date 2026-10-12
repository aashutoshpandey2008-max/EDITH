import { S } from './state'
import { useUI } from '../store/uiStore'
import { updateSensors } from './sensors'
import { runNavigation } from './NavigationController'
import { integrate } from './physics'
import { updateArm, updatePayload, updateBoxes } from './arm'
import { W } from './world'

const STEP = 1 / 60
let acc = 0

function fixedStep(dt) {
  S.dt = dt; S.time += dt
  updateSensors(dt)
  runNavigation()
  integrate(dt)
  updateArm(dt)
  updatePayload()
  updateBoxes(dt)
}

export function stepSim(dt) {
  if (!useUI.getState().running) return
  acc += dt
  let n = 0
  while (acc >= STEP && n < 6) { fixedStep(STEP); acc -= STEP; n++ }
  if (n === 6) acc = 0
}

export function snapshot() {
  const a = S.arm
  return {
    pose: { x: S.pose.x, z: S.pose.z, th: S.pose.th }, v: S.vel.v, w: S.vel.w,
    ir: S.ir.map((s) => ({ name: s.name, value: s.value, on: s.onLine })),
    us: { ...S.us }, nav: S.nav.state, task: S.nav.coName,
    arm: { yaw: a.yaw, boom: a.boom, ext: a.ext, grip: a.grip, t: { ...a.t }, limited: a.limited },
    head: { ...S.head }, payload: S.payload ? { id: S.payload.id, mass: S.payload.mass } : null,
    stability: S.stability, estop: S.estop, collision: S.collision,
    detections: S.detections.slice(0, 8).map((d) => ({ id: d.id, label: d.label, dist: d.dist, conf: d.conf })),
    delivered: W.boxes.filter((b) => b.delivered).length, boxes: W.boxes.length, obstacles: W.obstacles.length, time: S.time,
  }
}
