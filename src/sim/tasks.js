// High-level tasks (coroutines): pick, place, pick-and-place-all, return home.
import { S } from './state'
import { CONFIG } from '../config/robotConfig'
import { W, ZONES, DROP_SLOTS } from './world'
import { say } from '../voice/speech'
import { goTo, turnTo } from './NavigationController'
import { solveReach, rad } from './arm'

const A = CONFIG.arm
export function armSet(p) {
  const t = S.arm.t
  if (p.yaw !== undefined) t.yaw = p.yaw
  if (p.boom !== undefined) t.boom = Math.max(A.boomMin, Math.min(A.boomMax, p.boom))
  if (p.ext !== undefined) t.ext = Math.max(0, Math.min(A.extMax, p.ext))
  if (p.grip !== undefined) t.grip = Math.max(0, Math.min(1, p.grip))
}
const armDone = () => {
  const a = S.arm, t = a.t
  return Math.abs(a.yaw - t.yaw) < 0.8 && Math.abs(a.boom - t.boom) < 0.8 && Math.abs(a.ext - t.ext) < 0.006 && Math.abs(a.grip - t.grip) < 0.02
}
export function* waitArm(timeout = 20) {
  let t = 0
  while (t < timeout) { if (armDone()) return true; t += S.dt; yield }
  return false
}

function* approachTarget(x, z) {
  const dx = x - S.pose.x, dz = z - S.pose.z, d = Math.hypot(dx, dz) || 1
  const r = A.standoff
  yield* goTo(x - (dx / d) * r, z - (dz / d) * r, { tol: 0.07, stop: 0.12 })
  const phi = Math.atan2(x - S.pose.x, z - S.pose.z)
  yield* turnTo(phi - rad(A.pickYawOffset))
}

export function nearestBox() {
  let best = null, bd = Infinity
  for (const b of W.boxes) {
    if (b.held || b.delivered || b.failed) continue
    const d = Math.hypot(b.x - S.pose.x, b.z - S.pose.z)
    if (d < bd) { bd = d; best = b }
  }
  return best
}

export function* pickSequence(box) {
  S.nav.state = 'PICK'
  say(`Approaching ${box.id}.`, 'pickapp', 1)
  let reach = solveReach(box.x, box.z, box.size / 2)
  if (!reach.ok) {
    yield* approachTarget(box.x, box.z)
    reach = solveReach(box.x, box.z, box.size / 2)
    if (!reach.ok) { say('Target is out of reach.'); box.failed = true; return false }
  }
  armSet({ grip: 1, boom: 45, ext: 0.1 }); yield* waitArm()
  armSet({ yaw: reach.yaw }); yield* waitArm()
  say('Rotating robotic arm.', 'rot', 3)
  armSet({ boom: reach.boom, ext: reach.ext }); yield* waitArm()
  say('Closing gripper.', 'grip', 2)
  armSet({ grip: 0 }); yield* waitArm(5)
  if (!S.payload) {
    box.failed = true
    armSet({ grip: 1 }); yield* waitArm()
    armSet({ boom: A.carry.boom, ext: A.carry.ext }); yield* waitArm()
    return false
  }
  say('Object secured. Lifting.', 'lift', 2)
  armSet({ boom: A.carry.boom, ext: A.carry.ext }); yield* waitArm()
  return true
}

export function* placeSequence(slot) {
  const b = S.payload
  if (!b) { say('I am not holding anything.'); return false }
  S.nav.state = 'PLACE'
  say('Moving to the drop-off area.', 'dropapp', 2)
  yield* approachTarget(slot.x, slot.z)
  const reach = solveReach(slot.x, slot.z, b.size / 2 + 0.004)
  if (!reach.ok) { say('Drop-off point is out of reach.'); return false }
  armSet({ yaw: reach.yaw }); yield* waitArm()
  armSet({ boom: reach.boom, ext: reach.ext }); yield* waitArm()
  say('Releasing object.', 'rel2', 2)
  armSet({ grip: 1 }); yield* waitArm(5)
  armSet({ boom: A.carry.boom, ext: A.carry.ext }); yield* waitArm()
  return true
}

export function* returnHomeSeq() {
  S.nav.state = 'RETURN_HOME'
  say('Returning to starting position.', 'home', 3)
  armSet(A.home)
  yield* goTo(ZONES.home.x, ZONES.home.z, { tol: 0.08 })
  yield* turnTo(0)
  yield* waitArm()
  say('Home position reached.', 'homeok', 2)
}

export function* pickOneTask() {
  const box = nearestBox()
  if (!box) { say('There are no objects to pick up.'); return }
  const ok = yield* pickSequence(box)
  if (!ok) say(`Could not pick up ${box.id}.`)
  else say('Say "place the object" to deliver it.', 'hint', 5)
}

export function* placeTask() {
  const idx = W.boxes.filter((b) => b.delivered).length
  yield* placeSequence(DROP_SLOTS[idx % DROP_SLOTS.length])
}

export function* pickAndPlaceAll() {
  say('Starting object pickup and placement sequence.')
  for (let i = 0; i < 5; i++) {
    const box = nearestBox()
    if (!box) break
    if (!(yield* pickSequence(box))) continue
    const idx = W.boxes.filter((b) => b.delivered).length
    yield* placeSequence(DROP_SLOTS[idx % DROP_SLOTS.length])
  }
  yield* returnHomeSeq()
  const n = W.boxes.filter((b) => b.delivered).length
  const failed = W.boxes.filter((b) => b.failed).length
  say(`Task complete. Delivered ${n} object${n === 1 ? '' : 's'}${failed ? `, ${failed} could not be lifted` : ''}.`)
}
