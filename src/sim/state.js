import { CONFIG } from '../config/robotConfig'

const H = CONFIG.arm.home
// Mutable simulation state (NOT React state). Rendering reads it every frame; the UI polls snapshots.
export const S = {
  time: 0, dt: 1 / 60,
  pose: { x: 3.5, z: 0, th: 0 },
  vel: { v: 0, w: 0 }, cmd: { v: 0, w: 0 },
  wheels: { l: 0, r: 0 },
  keys: { f: false, b: false, l: false, r: false },
  ir: [], us: { front: 2.5, left: 2.5, right: 2.5 },
  detections: [], detectTimer: 0,
  arm: { yaw: H.yaw, boom: H.boom, ext: H.ext, grip: H.grip, t: { yaw: H.yaw, boom: H.boom, ext: H.ext, grip: H.grip }, limited: '' },
  head: { pan: 0, tilt: 0 },
  payload: null, stability: 1, tip: { x: 0, y: 0, z: 0 },
  estop: false, collision: false, speaking: false,
  nav: { state: 'IDLE', co: null, coName: '', lastSide: 1, halted: false, blocked: 0, target: null, cool: 0, altFlip: false },
  say: {},
}

export function resetState(start = { x: 3.5, z: 0, th: 0 }) {
  S.time = 0
  Object.assign(S.pose, start)
  S.vel.v = S.vel.w = 0; S.cmd.v = S.cmd.w = 0
  S.wheels.l = S.wheels.r = 0
  S.keys.f = S.keys.b = S.keys.l = S.keys.r = false
  Object.assign(S.arm, { yaw: H.yaw, boom: H.boom, ext: H.ext, grip: H.grip, limited: '' })
  Object.assign(S.arm.t, { yaw: H.yaw, boom: H.boom, ext: H.ext, grip: H.grip })
  S.head.pan = S.head.tilt = 0
  S.payload = null; S.estop = false; S.collision = false; S.detections = []
  Object.assign(S.nav, { state: 'IDLE', co: null, coName: '', halted: false, blocked: 0, target: null, cool: 0 })
  S.say = {}
}
