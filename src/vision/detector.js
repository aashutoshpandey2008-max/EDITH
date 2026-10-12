// ─────────────────────────────────────────────────────────────────────────────
// OBJECT DETECTION — SIMULATED.
// MetadataDetector does NOT run computer vision. It reads the known scene objects
// (labels/sizes) and applies field-of-view, range and line-of-sight tests.
// To integrate real vision later, implement the same `detect()` contract returning
// [{ id, label, kind, dist, bearing, conf, bounds }] from a YOLO/OpenCV pipeline fed
// by the camera frames (see CameraFeeds in components/Scene.jsx for the pixel source).
// ─────────────────────────────────────────────────────────────────────────────
import { CONFIG } from '../config/robotConfig'
import { W } from '../sim/world'
import { castRay } from '../sim/raycast'

const wrapPi = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a }

export function boundsOf(o) {
  const h = o.h || 0.3
  return { cx: o.x, cy: h / 2, cz: o.z, sx: o.type === 'cyl' ? o.r * 2 : o.w, sy: h, sz: o.type === 'cyl' ? o.r * 2 : o.d }
}

export class MetadataDetector {
  detect(cam) {
    const out = [], hf = (CONFIG.camera.hfov * Math.PI) / 180, range = CONFIG.camera.detectRange
    for (const list of [W.obstacles, W.boxes]) {
      for (const o of list) {
        if (o.held) continue
        const dx = o.x - cam.x, dz = o.z - cam.z, d = Math.hypot(dx, dz)
        if (d > range || d < 0.05) continue
        const bearing = wrapPi(Math.atan2(dx, dz) - cam.yaw)
        if (Math.abs(bearing) > hf / 2 + 0.05) continue
        const r = castRay(cam.x, cam.z, dx / d, dz / d, d, o.id)
        const radius = o.type === 'cyl' ? o.r : Math.max(o.w, o.d) / 2
        if (r.t < d - radius - 0.03) continue // occluded
        out.push({ id: o.id, label: o.label, kind: o.kind, dist: d, bearing, conf: Math.max(0.55, 0.98 - d * 0.1), bounds: boundsOf(o) })
      }
    }
    // Walls / station: sample rays across the FOV and report the nearest structure hit.
    let wall = null
    for (let i = 0; i <= 8; i++) {
      const a = cam.yaw - hf / 2 + (hf * i) / 8
      const r = castRay(cam.x, cam.z, Math.sin(a), Math.cos(a), range)
      if (r.hit && (r.hit.kind === 'wall' || r.hit.kind === 'station') && (!wall || r.t < wall.t)) wall = { t: r.t, a, hit: r.hit }
    }
    if (wall) {
      out.push({
        id: wall.hit.id, label: wall.hit.label, kind: wall.hit.kind, dist: wall.t, bearing: wrapPi(wall.a - cam.yaw), conf: 0.9,
        bounds: { cx: cam.x + Math.sin(wall.a) * wall.t, cy: 0.15, cz: cam.z + Math.cos(wall.a) * wall.t, sx: 0.6, sy: 0.3, sz: 0.6 },
      })
    }
    return out.sort((a, b) => a.dist - b.dist)
  }
}
export const detector = new MetadataDetector()
