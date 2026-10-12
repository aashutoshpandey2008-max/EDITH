import { W } from './world'

// 2-D ray vs axis-aligned box / circle (dx,dz must be normalised). Returns distance or Infinity.
export function rayHit(ox, oz, dx, dz, o, maxT) {
  if (o.type === 'cyl') {
    const fx = ox - o.x, fz = oz - o.z
    const b = fx * dx + fz * dz, c = fx * fx + fz * fz - o.r * o.r
    if (c > 0 && b > 0) return Infinity
    const disc = b * b - c
    if (disc < 0) return Infinity
    const t = Math.max(0, -b - Math.sqrt(disc))
    return t <= maxT ? t : Infinity
  }
  const hw = o.w / 2, hd = o.d / 2
  let tmin = 0, tmax = maxT
  if (Math.abs(dx) < 1e-9) { if (ox < o.x - hw || ox > o.x + hw) return Infinity }
  else {
    let t1 = (o.x - hw - ox) / dx, t2 = (o.x + hw - ox) / dx
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2)
    if (tmin > tmax) return Infinity
  }
  if (Math.abs(dz) < 1e-9) { if (oz < o.z - hd || oz > o.z + hd) return Infinity }
  else {
    let t1 = (o.z - hd - oz) / dz, t2 = (o.z + hd - oz) / dz
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2)
    if (tmin > tmax) return Infinity
  }
  return tmin
}

export function castRay(ox, oz, dx, dz, maxD, ignoreId = null) {
  let best = maxD, hit = null
  for (const list of [W.walls, W.obstacles, W.boxes]) {
    for (const o of list) {
      if (o.held || o.id === ignoreId) continue
      const t = rayHit(ox, oz, dx, dz, o, best)
      if (t < best) { best = t; hit = o }
    }
  }
  return { t: best, hit }
}
