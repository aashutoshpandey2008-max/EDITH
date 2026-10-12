import { W, TRACK_DEF, ZONES, ARENA } from './world'

let nid = 1
const newId = (p = 'OBS') => `${p}-${nid++}`
const onTrack = (t) => ({ x: TRACK_DEF.a * Math.cos(t), z: TRACK_DEF.b * Math.sin(t) })

export function addBoxObstacle(x, z, w = 0.35, d = 0.35, h = 0.3) {
  W.obstacles.push({ id: newId(), kind: 'obstacle', label: 'obstacle', type: 'box', x, z, w, d, h, y: h / 2, color: '#c2410c' })
}
export function addCylObstacle(x, z, r = 0.17, h = 0.35) {
  W.obstacles.push({ id: newId(), kind: 'obstacle', label: 'obstacle', type: 'cyl', x, z, r, w: r * 2, d: r * 2, h, y: h / 2, color: '#f59e0b' })
}
export function addPerson(x, z) {
  W.obstacles.push({ id: newId('PERSON'), kind: 'person', label: 'person', type: 'cyl', x, z, r: 0.2, w: 0.4, d: 0.4, h: 1.0, y: 0.5, color: '#10b981' })
}
function addCrate(id, x, z, size, mass, color) {
  W.boxes.push({ id, kind: 'box', label: 'box', type: 'box', x, z, w: size, d: size, h: size, size, y: size / 2, vy: 0, mass, color, held: false, delivered: false, failed: false })
}
const crates = () => {
  addCrate('BOX-1', -2.0, 0.5, 0.10, 0.4, '#ef4444')
  addCrate('BOX-2', -2.0, 0.0, 0.08, 0.3, '#f59e0b')
  addCrate('BOX-3', -2.0, -0.5, 0.12, 1.5, '#64748b') // too heavy: demonstrates payload limit
}
const HOME = { x: 3.5, z: 0, th: 0 }

export const SCENARIOS = {
  A: { name: 'A · Manual navigation', mode: 'manual', start: HOME, hint: 'Drive with WASD / arrows or the D-pad. Collision guard slows and stops you near obstacles.',
    build() { addCylObstacle(-0.8, 1.3); addBoxObstacle(1.2, -1.1); addBoxObstacle(-3.6, -1.2, 0.4, 0.4); crates() } },
  B: { name: 'B · Autonomous path following', mode: 'autonomous', start: HOME, hint: 'The robot follows the black line using its 5 IR sensors and crosses intersections by the selected rule.',
    build() { crates() } },
  C: { name: 'C · Obstacle avoidance', mode: 'autonomous', start: HOME, hint: 'Obstacles sit on the line. The ultrasonic sensors stop the robot, then it detours and rejoins the line.',
    build() { const a = onTrack(0.9), b = onTrack(3.6), c = onTrack(5.2); addBoxObstacle(a.x, a.z); addCylObstacle(b.x, b.z); addPerson(c.x, c.z); crates() } },
  D: { name: 'D · Robotic arm operation', mode: 'manual', start: { x: -1.25, z: 0, th: -Math.PI / 2 }, hint: 'Robot is parked at the pickup area. Use the arm sliders / buttons to operate the crane.',
    build() { crates() } },
  E: { name: 'E · Object pickup & placement', mode: 'manual', start: HOME, hint: 'Press "Run pick & place": the robot drives to each box, picks it, delivers it to the drop-off zone and returns home.',
    build() { addBoxObstacle(0.6, 1.7); addCylObstacle(-0.4, -1.3); crates() } },
  F: { name: 'F · Voice-controlled operation', mode: 'manual', start: { x: 0.6, z: 0.3, th: 0 }, hint: 'Use the microphone or the text box: "move forward", "rotate arm 90 degrees", "pick up the object"…',
    build() { addCylObstacle(0.8, 1.6); addPerson(-1.0, 1.4); crates() } },
}

export function buildWorld(id) {
  W.obstacles.length = 0; W.boxes.length = 0; nid = 1
  const sc = SCENARIOS[id]
  sc.build()
  return sc
}

export function randomObstacle(robot) {
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() * 2 - 1) * (ARENA.halfX - 0.8), z = (Math.random() * 2 - 1) * (ARENA.halfZ - 0.8)
    if (Math.hypot(x - robot.x, z - robot.z) < 1.2) continue
    if (Object.values(ZONES).some((zn) => Math.abs(x - zn.x) < zn.w / 2 + 0.4 && Math.abs(z - zn.z) < zn.d / 2 + 0.4)) continue
    if ([...W.obstacles, ...W.boxes, ...W.walls].some((o) => Math.hypot(o.x - x, o.z - z) < 0.8)) continue
    if (Math.random() < 0.5) addCylObstacle(x, z, 0.15 + Math.random() * 0.1)
    else addBoxObstacle(x, z, 0.25 + Math.random() * 0.25, 0.25 + Math.random() * 0.25)
    return true
  }
  return false
}
