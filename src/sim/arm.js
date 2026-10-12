import { CONFIG } from '../config/robotConfig'
import { S } from './state'
import { W, ZONES, inZone } from './world'
import { say } from '../voice/speech'

const A = CONFIG.arm
export const rad = (d) => (d * Math.PI) / 180
export const deg = (r) => (r * 180) / Math.PI
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const approach = (c, t, s) => (Math.abs(t - c) <= s ? t : c + Math.sign(t - c) * s)
const wrapPi = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a }
export const wrapDeg = (d) => ((((d + 180) % 360) + 360) % 360) - 180

export const gripWidth = (g) => A.gripMinWidth + g * (A.gripMaxWidth - A.gripMinWidth)
export const gripFor = (w) => clamp((w - A.gripMinWidth) / (A.gripMaxWidth - A.gripMinWidth), 0, 1)

// World position of the gripper pad centre (the arm pivots at the robot centre).
export function tipPoint(a = S.arm, p = S.pose) {
  const len = A.boomLength + a.ext, b = rad(a.boom), r = len * Math.cos(b), ya = p.th + rad(a.yaw)
  return { x: p.x + Math.sin(ya) * r, z: p.z + Math.cos(ya) * r, y: A.baseHeight + len * Math.sin(b) - A.gripperDrop, reach: r }
}

// Inverse kinematics: arm settings that put the pad centre at (x, gh, z).
export function solveReach(x, z, gh) {
  const dx = x - S.pose.x, dz = z - S.pose.z
  const r = Math.hypot(dx, dz), phi = Math.atan2(dx, dz)
  const dh = gh + A.gripperDrop - A.baseHeight
  const len = Math.hypot(r, dh), ext = len - A.boomLength, boom = deg(Math.atan2(dh, r))
  const yawRel = deg(wrapPi(phi - S.pose.th))
  const yaw = S.arm.yaw + wrapDeg(yawRel - S.arm.yaw)
  const ok = ext >= -0.005 && ext <= A.extMax + 0.005 && boom >= A.boomMin && boom <= A.boomMax
  return { ok, yaw, boom, ext: clamp(ext, 0, A.extMax), r }
}

// Static tip-over margin (1 = centred, 0 = centre of mass at the edge of the wheel footprint).
export function stability(a = S.arm) {
  const len = A.boomLength + a.ext, b = rad(a.boom), r = len * Math.cos(b), y = rad(a.yaw)
  const mp = S.payload ? S.payload.mass : 0
  const M = CONFIG.chassis.mass + A.mass + mp
  const armR = 0.45 * len * Math.cos(b)
  const cx = (A.mass * armR * Math.sin(y) + mp * r * Math.sin(y)) / M
  const cz = (A.mass * armR * Math.cos(y) + mp * r * Math.cos(y)) / M
  return 1 - Math.max(Math.abs(cx) / (CONFIG.wheel.track / 2), Math.abs(cz) / (CONFIG.wheel.wheelbase / 2))
}

export function updateArm(dt) {
  const a = S.arm, t = a.t
  if (S.estop) return
  a.yaw = approach(a.yaw, t.yaw, A.yawRate * dt)
  a.grip = approach(a.grip, t.grip, A.gripRate * dt)
  let nb = approach(a.boom, clamp(t.boom, A.boomMin, A.boomMax), A.boomRate * dt)
  let ne = approach(a.ext, clamp(t.ext, 0, A.extMax), A.extRate * dt)
  a.limited = ''
  // Prevent the gripper from digging into the floor.
  const minTip = S.payload ? S.payload.size / 2 : 0.02
  const len = A.boomLength + ne
  if (A.baseHeight + len * Math.sin(rad(nb)) - A.gripperDrop < minTip) {
    const s = (minTip + A.gripperDrop - A.baseHeight) / len
    nb = Math.max(nb, deg(Math.asin(clamp(s, -1, 1))))
    a.limited = 'ground contact'
  }
  // Prevent motions that push the robot toward tipping over.
  const m1 = stability({ ext: ne, boom: nb, yaw: a.yaw })
  if (m1 < 0.03 && m1 < stability(a)) { ne = a.ext; nb = a.boom; a.limited = 'tip-over limit'; say('Movement blocked to keep the robot stable.', 'tip', 5) }
  a.boom = nb; a.ext = ne
  S.stability = stability(a)
}

export function updatePayload() {
  const a = S.arm, tp = tipPoint()
  S.tip = tp
  const width = gripWidth(a.grip)
  if (S.payload) {
    const b = S.payload, need = gripFor(b.size)
    if (a.grip < need) { a.grip = need }
    if (a.t.grip < need) a.t.grip = need
    b.x = tp.x; b.z = tp.z; b.y = tp.y
    if (width > b.size + 0.012) { b.held = false; b.vy = 0; S.payload = null; say('Object released.', 'rel', 1) }
    return
  }
  for (const b of W.boxes) {
    if (b.held) continue
    if (Math.hypot(b.x - tp.x, b.z - tp.z) < 0.04 && Math.abs(b.y - tp.y) < 0.045) {
      const need = gripFor(b.size)
      if (a.grip < need) {
        const closing = a.t.grip < need - 0.02
        a.grip = need
        if (closing) {
          a.t.grip = need
          if (b.mass <= A.maxPayload) { b.held = true; S.payload = b }
          else say(`Payload ${b.mass.toFixed(1)} kg exceeds the ${A.maxPayload} kg limit. Cannot lift.`, 'heavy', 6)
        }
      }
      break
    }
  }
}

export function updateBoxes(dt) {
  for (const b of W.boxes) {
    if (b.held) continue
    const gy = b.size / 2
    if (b.y > gy + 1e-4) { b.vy -= 9.81 * dt; b.y = Math.max(gy, b.y + b.vy * dt); if (b.y === gy) b.vy = 0 }
    b.delivered = inZone(ZONES.drop, b.x, b.z) && b.y <= gy + 1e-3
  }
}
