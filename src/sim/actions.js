// Every user-facing command (dashboard buttons, keyboard, voice) goes through these functions.
import { S, resetState } from './state'
import { CONFIG } from '../config/robotConfig'
import { useUI } from '../store/uiStore'
import { say } from '../voice/speech'
import { startCo, cancelCo, turnBy, driveDist } from './NavigationController'
import { buildWorld, SCENARIOS, randomObstacle } from './scenarios'
import { W } from './world'
import { armSet, pickOneTask, placeTask, pickAndPlaceAll, returnHomeSeq } from './tasks'

const A = CONFIG.arm
const ui = () => useUI.getState()

export function loadScenario(id, { silent = false } = {}) {
  const sc = buildWorld(id)
  resetState({ ...sc.start })
  useUI.getState().patch({ scenario: id, mode: sc.mode, running: true })
  useUI.getState().bump()
  if (!silent) say(`Scenario ${sc.name} loaded.`)
}
export const resetSim = () => loadScenario(ui().scenario)
export const togglePause = () => useUI.getState().patch({ running: !ui().running })

export function setMode(m) {
  cancelCo(); S.nav.halted = false; S.nav.haltReason = ''; S.nav.blocked = 0
  ui().patch({ mode: m })
  say(m === 'autonomous' ? 'Autonomous mode activated.' : 'Manual mode activated.')
}
export function stopRobot() {
  cancelCo(); S.keys.f = S.keys.b = S.keys.l = S.keys.r = false
  S.cmd.v = S.cmd.w = 0
  if (ui().mode === 'autonomous') { ui().patch({ mode: 'manual' }); say('Stopping. Switching to manual mode.') } else say('Stopping.')
}
export function emergencyStop() {
  S.estop = true; cancelCo()
  Object.assign(S.arm.t, { yaw: S.arm.yaw, boom: S.arm.boom, ext: S.arm.ext, grip: S.arm.grip })
  say('Emergency stop activated.')
}
export function releaseEstop() { S.estop = false; S.nav.halted = false; say('Emergency stop released.') }

export function key(k, down) { S.keys[k] = down }

// timed / discrete voice-style moves
export function moveForward(m = 1) { cancelCo(); say('Moving forward.'); startCo((function* () { yield* driveDist(m, 0.35) })(), 'MOVE') }
export function moveBackward(m = 0.6) { cancelCo(); say('Moving backward.'); startCo((function* () { yield* driveDist(-m, 0.3, { guard: false }) })(), 'MOVE') }
export function turnRobot(deg) { cancelCo(); say(deg > 0 ? 'Turning left.' : 'Turning right.'); startCo((function* () { yield* turnBy(deg) })(), 'TURN') }

// arm
export function armRotateBy(deg, cw = true) {
  if (S.estop) return
  S.arm.t.yaw += cw ? -deg : deg
  say(`Rotating robotic arm ${deg} degrees ${cw ? 'clockwise' : 'anticlockwise'}.`)
}
export function armSpin360() { armRotateBy(360, true) }
export function armNudge(p) {
  if (S.estop) return
  const t = S.arm.t
  armSet({ boom: t.boom + (p.boom || 0), ext: t.ext + (p.ext || 0), yaw: t.yaw + (p.yaw || 0) })
}
export function armTarget(p) { if (!S.estop) armSet(p) }
export function armYawToDeg(v) { // slider 0..360, take the shortest path
  const cur = S.arm.t.yaw, diff = ((((v - cur) % 360) + 540) % 360) - 180
  if (!S.estop) S.arm.t.yaw = cur + diff
}
export function armHold(axis, dir) {
  if (S.estop) return
  const a = S.arm
  if (axis === 'yaw') a.t.yaw = a.yaw + dir * 720
  if (axis === 'boom') a.t.boom = dir > 0 ? A.boomMax : A.boomMin
  if (axis === 'ext') a.t.ext = dir > 0 ? A.extMax : 0
  if (axis === 'grip') a.t.grip = dir > 0 ? 1 : 0
}
export function armRelease(axis) {
  const a = S.arm
  if (axis === 'grip') return
  a.t[axis] = a[axis]
}
export function armHome() { if (!S.estop) { armSet(A.home); say('Arm returning to home position.') } }
export function gripper(open) { if (!S.estop) { armSet({ grip: open ? 1 : 0 }); say(open ? 'Opening gripper.' : 'Closing gripper.') } }
export function headSet(p) { Object.assign(S.head, p) }

// tasks
export function pickUp() { if (S.estop) return; cancelCo(); startCo(pickOneTask(), 'PICK_UP') }
export function placeObject() { if (S.estop) return; cancelCo(); startCo(placeTask(), 'PLACE') }
export function runPickAndPlace() { if (S.estop) return; cancelCo(); startCo(pickAndPlaceAll(), 'PICK_AND_PLACE') }
export function returnHome() {
  if (S.estop) return
  cancelCo(); startCo(returnHomeSeq(), 'RETURN_HOME')
}

// environment
export function addObstacle() {
  if (randomObstacle(S.pose)) { ui().bump(); say('Obstacle added.') } else say('No free space for another obstacle.')
}
export function removeObstacle() {
  if (W.obstacles.pop()) { ui().bump(); say('Obstacle removed.') }
}

// reports
export function describeFront() {
  const u = S.us.front, mx = CONFIG.ultrasonic.maxRange
  const seen = S.detections.filter((d) => Math.abs(d.bearing) < 0.35 && d.kind !== 'wall')[0] || S.detections[0]
  const dist = u >= mx - 0.01 ? 'Ultrasonic sensor reports no echo within range.' : `Ultrasonic sensor reads ${(u * 100).toFixed(0)} centimetres.`
  const vis = seen ? `Cameras see a ${seen.label} at about ${seen.dist.toFixed(1)} metres.` : 'Cameras do not detect any object.'
  return `${dist} ${vis}`
}
export function sensorReport() {
  const ir = S.ir.map((s) => `${s.name} ${s.onLine ? 'on line' : 'off'}`).join(', ')
  const u = S.us
  return `Mode ${ui().mode}, state ${S.nav.state}. IR: ${ir}. Ultrasonic front ${(u.front * 100).toFixed(0)}, left ${(u.left * 100).toFixed(0)}, right ${(u.right * 100).toFixed(0)} centimetres. Arm base ${(((S.arm.yaw % 360) + 360) % 360).toFixed(0)} degrees, boom ${S.arm.boom.toFixed(0)}, extension ${(S.arm.ext * 100).toFixed(0)} centimetres. ${S.payload ? 'Carrying ' + S.payload.id + '.' : 'Gripper empty.'}`
}
