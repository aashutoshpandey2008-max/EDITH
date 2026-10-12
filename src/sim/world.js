import { CONFIG } from '../config/robotConfig'

export const ARENA = { halfX: 5.5, halfZ: 4.0 }
export const TRACK_DEF = { a: 3.5, b: 2.2, width: CONFIG.irSensors.lineWidth }

function buildTrack() {
  const { a, b } = TRACK_DEF
  const N = 160, loop = []
  for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2; loop.push({ x: a * Math.cos(t), z: b * Math.sin(t) }) }
  // Cross-path through the centre; it overshoots the loop by 0.3 m so the crossings are true intersections.
  const chord = [{ x: 0, z: -(b + 0.3) }, { x: 0, z: b + 0.3 }]
  const segs = []
  for (let i = 0; i < N; i++) { const p = loop[i], q = loop[(i + 1) % N]; segs.push([p.x, p.z, q.x, q.z]) }
  segs.push([chord[0].x, chord[0].z, chord[1].x, chord[1].z])
  return { loop, chord, segs }
}
export const TRACK = buildTrack()

export function distToTrack(x, z) {
  let best = Infinity
  for (const s of TRACK.segs) {
    const dx = s[2] - s[0], dz = s[3] - s[1]
    let t = ((x - s[0]) * dx + (z - s[1]) * dz) / (dx * dx + dz * dz)
    t = t < 0 ? 0 : t > 1 ? 1 : t
    const px = s[0] + t * dx - x, pz = s[1] + t * dz - z
    const d = px * px + pz * pz
    if (d < best) best = d
  }
  return Math.sqrt(best)
}

export const ZONES = {
  pickup: { x: -2.0, z: 0, w: 1.2, d: 1.6 },
  drop: { x: 2.3, z: 0, w: 1.2, d: 2.2 },
  home: { x: 3.5, z: 0, w: 1.0, d: 0.9 },
}
export const DROP_SLOTS = [{ x: 2.3, z: 0.95 }, { x: 2.3, z: -0.95 }, { x: 2.3, z: 0 }]
export const inZone = (zn, x, z) => Math.abs(x - zn.x) <= zn.w / 2 && Math.abs(z - zn.z) <= zn.d / 2

// Mutable world. Lists are mutated in place so references stay valid.
export const W = {
  walls: [
    { id: 'WALL-N', kind: 'wall', label: 'wall', type: 'box', x: 0, z: ARENA.halfZ, w: ARENA.halfX * 2, d: 0.1, h: 0.3, y: 0.15 },
    { id: 'WALL-S', kind: 'wall', label: 'wall', type: 'box', x: 0, z: -ARENA.halfZ, w: ARENA.halfX * 2, d: 0.1, h: 0.3, y: 0.15 },
    { id: 'WALL-E', kind: 'wall', label: 'wall', type: 'box', x: ARENA.halfX, z: 0, w: 0.1, d: ARENA.halfZ * 2, h: 0.3, y: 0.15 },
    { id: 'WALL-W', kind: 'wall', label: 'wall', type: 'box', x: -ARENA.halfX, z: 0, w: 0.1, d: ARENA.halfZ * 2, h: 0.3, y: 0.15 },
    { id: 'STATION', kind: 'station', label: 'charging station', type: 'box', x: 4.5, z: 0, w: 0.3, d: 0.5, h: 0.4, y: 0.2 },
  ],
  obstacles: [],
  boxes: [],
}
