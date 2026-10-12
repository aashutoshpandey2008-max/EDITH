import { CONFIG } from '../config/robotConfig'
import { distToTrack } from './world'
import { S } from './state'
import { castRay } from './raycast'
import { detector } from '../vision/detector'

const rad = (d) => (d * Math.PI) / 180
export function toWorld(p, lx, lz) {
  const c = Math.cos(p.th), s = Math.sin(p.th)
  return { x: p.x + lx * c + lz * s, z: p.z - lx * s + lz * c }
}

// IR reflective sensors: respond ONLY to the black line on the floor (not to obstacles).
export function readIR() {
  const cfg = CONFIG.irSensors, half = cfg.lineWidth / 2
  S.ir = cfg.spots.map((sp) => {
    const w = toWorld(S.pose, sp.x, cfg.forwardOffset)
    const d = distToTrack(w.x, w.z)
    const value = Math.max(0, Math.min(1, 1 - (d - half) / cfg.falloff))
    return { name: sp.name, x: sp.x, value, onLine: value >= 0.5, wx: w.x, wz: w.z }
  })
}

// Ultrasonic: multi-ray cone model, returns nearest echo within range.
export function readUltrasonic() {
  const u = CONFIG.ultrasonic, half = rad(u.coneDeg / 2)
  for (const key of ['front', 'left', 'right']) {
    const c = u.sensors[key], o = toWorld(S.pose, c.x, c.z), base = S.pose.th + rad(c.yaw)
    let best = u.maxRange
    for (let i = 0; i <= 8; i++) {
      const a = base - half + (2 * half * i) / 8
      const r = castRay(o.x, o.z, Math.sin(a), Math.cos(a), u.maxRange)
      if (r.t < best) best = r.t
    }
    S.us[key] = Math.max(best, u.minRange)
  }
}

export function camPose() {
  const h = CONFIG.camera.head, p = toWorld(S.pose, h.x, h.z + 0.05)
  return { x: p.x, z: p.z, yaw: S.pose.th + rad(S.head.pan) }
}

export function updateSensors(dt) {
  readIR(); readUltrasonic()
  S.detectTimer -= dt
  if (S.detectTimer <= 0) { S.detections = detector.detect(camPose()); S.detectTimer = 0.1 }
}
