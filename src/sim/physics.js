import { CONFIG } from '../config/robotConfig'
import { S } from './state'
import { W } from './world'

const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const approach = (c, t, s) => (Math.abs(t - c) <= s ? t : c + Math.sign(t - c) * s)
const wrapPi = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a }

// Differential-drive kinematics with acceleration limits + 2-D circle-vs-shape collision resolution.
// (Simplified: Rapier is not used; this is deterministic and sufficient for planar driving.)
export function integrate(dt) {
  const d = CONFIG.drive, p = S.pose
  if (S.estop) { S.vel.v = 0; S.vel.w = 0; S.cmd.v = 0; S.cmd.w = 0 }
  const cv = clamp(S.cmd.v, -d.maxSpeed, d.maxSpeed), cw = clamp(S.cmd.w, -d.maxTurnRate, d.maxTurnRate)
  S.vel.v = approach(S.vel.v, cv, d.accel * dt)
  S.vel.w = approach(S.vel.w, cw, d.turnAccel * dt)
  p.th = wrapPi(p.th + S.vel.w * dt)
  const vL = S.vel.v - (S.vel.w * CONFIG.wheel.track) / 2
  const vR = S.vel.v + (S.vel.w * CONFIG.wheel.track) / 2
  S.wheels.l += (vL / CONFIG.wheel.radius) * dt
  S.wheels.r += (vR / CONFIG.wheel.radius) * dt
  p.x += Math.sin(p.th) * S.vel.v * dt
  p.z += Math.cos(p.th) * S.vel.v * dt
  S.collision = resolveCollisions()
}

function resolveCollisions() {
  const R = CONFIG.chassis.collisionRadius, p = S.pose
  let hit = false
  for (const list of [W.walls, W.obstacles, W.boxes]) {
    for (const o of list) {
      if (o.held) continue
      if (o.type === 'cyl') {
        const dx = p.x - o.x, dz = p.z - o.z, dist = Math.hypot(dx, dz), min = R + o.r
        if (dist < min && dist > 1e-6) { p.x += (dx / dist) * (min - dist); p.z += (dz / dist) * (min - dist); hit = true }
      } else {
        const hw = o.w / 2, hd = o.d / 2
        const cx = clamp(p.x, o.x - hw, o.x + hw), cz = clamp(p.z, o.z - hd, o.z + hd)
        const dx = p.x - cx, dz = p.z - cz, dist = Math.hypot(dx, dz)
        if (dist < R) {
          if (dist > 1e-6) { p.x += (dx / dist) * (R - dist); p.z += (dz / dist) * (R - dist) }
          else { p.x += p.x >= o.x ? hw + R - (p.x - o.x) : -(hw + R - (o.x - p.x)) }
          hit = true
        }
      }
    }
  }
  if (hit) S.vel.v *= 0.5
  return hit
}
