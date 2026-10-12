// ─────────────────────────────────────────────────────────────────────────────
// NavigationController — manual drive, IR line following, ultrasonic obstacle handling and
// a tiny coroutine runner (generators) used for multi-step behaviours (avoidance, tasks, voice moves).
// ─────────────────────────────────────────────────────────────────────────────
import { S } from './state'
import { CONFIG } from '../config/robotConfig'
import { useUI } from '../store/uiStore'
import { say } from '../voice/speech'

const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
export const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a }
const ui = () => useUI.getState()
const sf = () => 0.5 + ui().speed
const stopCmd = () => { S.cmd.v = 0; S.cmd.w = 0 }
const irAny = () => S.ir.some((s) => s.onLine)

export function startCo(gen, name = 'TASK') { S.nav.co = gen; S.nav.coName = name }
export function cancelCo() { S.nav.co = null; S.nav.coName = ''; S.nav.target = null; stopCmd() }

// ── motion primitives (generators: each `yield` = one simulation tick) ──────────────────────────
export function* turnTo(target, { timeout = 10 } = {}) {
  let t = 0
  while (t < timeout) {
    const e = wrap(target - S.pose.th)
    if (Math.abs(e) < 0.03) break
    const wm = CONFIG.drive.maxTurnRate * clamp(ui().speed + 0.3, 0.5, 1)
    S.cmd.v = 0; S.cmd.w = Math.sign(e) * clamp(Math.abs(e) * 3, 0.25, wm)
    t += S.dt; yield
  }
  stopCmd()
}
export function* turnBy(deg, o) { yield* turnTo(S.pose.th + (deg * Math.PI) / 180, o) }

export function* driveDist(dist, speed = 0.3, { guard = true } = {}) {
  const dir = Math.sign(dist) || 1, target = Math.abs(dist)
  let moved = 0, t = 0
  while (moved < target && t < 40) {
    if (guard && dir > 0 && S.us.front < ui().stopDist) { stopCmd(); return false }
    S.cmd.v = dir * speed * sf(); S.cmd.w = 0
    moved += Math.abs(S.vel.v) * S.dt; t += S.dt; yield
  }
  stopCmd(); return true
}

export function* driveUntil(cond, maxDist, speed = 0.25) {
  let moved = 0
  while (moved < maxDist) {
    if (cond()) { stopCmd(); return true }
    if (S.us.front < ui().stopDist) { stopCmd(); return false }
    S.cmd.v = speed * sf(); S.cmd.w = 0
    moved += Math.abs(S.vel.v) * S.dt; yield
  }
  stopCmd(); return false
}

// ── obstacle handling: stop → wait for it to clear → otherwise side-step around it ──────────────
export function* obstacleRoutine(resume = 'line') {
  const n = S.nav
  n.state = 'OBSTACLE_STOP'; stopCmd()
  say('Obstacle detected ahead.', 'obstacle', 5)
  let t = 0
  while (t < 1.5) {
    stopCmd(); t += S.dt; yield
    if (S.us.front > ui().stopDist + 0.12) { say('Path is clear.', 'clear', 3); n.blocked = 0; return }
  }
  n.blocked++
  if (n.blocked > 4) { say('Path is blocked. Halting.', 'blocked', 5); n.halted = true; return }
  yield* sidestep(resume)
}

export function* sidestep(resume) {
  const n = S.nav
  n.state = 'AVOIDING'
  const s = S.us.left >= S.us.right ? 1 : -1 // +1 = go around on the left
  say(`Attempting an alternate route to the ${s > 0 ? 'left' : 'right'}.`, 'avoid', 4)
  const h0 = S.pose.th, off = CONFIG.navigation.avoidOffset
  yield* turnTo(h0 + (s * Math.PI) / 2)
  if (!(yield* driveDist(off, 0.3))) return false
  yield* turnTo(h0)
  const key = s > 0 ? 'right' : 'left' // sensor that faces the obstacle while passing
  let seen = false, extra = 0, trav = 0
  while (trav < 3.5) {
    if (S.us.front < ui().stopDist) { stopCmd(); return false }
    const d = S.us[key]
    if (d < 1.0) seen = true
    S.cmd.v = 0.3 * sf(); S.cmd.w = 0
    const m = Math.abs(S.vel.v) * S.dt; trav += m
    if (seen && d >= 1.0) { extra += m; if (extra >= 0.4) break }
    yield
  }
  if (resume === 'line') {
    n.state = 'RETURN_TO_LINE'
    yield* turnTo(h0 - (s * Math.PI) / 2)
    const found = yield* driveUntil(irAny, off + 0.8, 0.25)
    if (found) { yield* driveDist(CONFIG.irSensors.forwardOffset, 0.2, { guard: false }); yield* turnTo(h0) }
    else say('Line not found after the detour.', 'nolinedetour', 5)
  }
  stopCmd(); n.blocked = 0
  say('Path is clear. Resuming navigation.', 'resume', 4)
  return true
}

// Drive to a point (point-and-shoot steering) with ultrasonic slow-down + avoidance.
export function* goTo(x, z, { tol = 0.1, stop = null, maxTime = 90 } = {}) {
  const n = S.nav
  n.state = 'GOTO'; n.target = { x, z }
  let t = 0
  while (t < maxTime) {
    const dx = x - S.pose.x, dz = z - S.pose.z, d = Math.hypot(dx, dz)
    if (d < tol) break
    const err = wrap(Math.atan2(dx, dz) - S.pose.th)
    const sd = stop ?? ui().stopDist
    if (S.us.front < sd && Math.abs(err) < 0.6) {
      yield* obstacleRoutine('goto')
      if (n.halted) break
      n.state = 'GOTO'; t += S.dt; yield; continue
    }
    let v = 0, w = clamp(err * 2.5, -1.6, 1.6)
    if (Math.abs(err) > 0.45) { w = Math.sign(err) * clamp(Math.abs(err) * 3, 0.3, 1.8) }
    else {
      const slow = S.us.front < ui().slowDist ? clamp((S.us.front - sd) / (ui().slowDist - sd), 0.3, 1) : 1
      v = Math.min(0.45 * sf(), 0.15 + d * 1.2) * slow
      // side sonars nudge the robot away from objects it is passing (skipped during fine pick/place approach)
      if (stop === null) {
        if (S.us.left < 0.45) w -= (0.45 - S.us.left) * 3
        if (S.us.right < 0.45) w += (0.45 - S.us.right) * 3
      }
    }
    S.cmd.v = v; S.cmd.w = w; t += S.dt; yield
  }
  stopCmd(); n.target = null
}

// ── line following behaviours ──────────────────────────────────────────────────────────────────
function* intersectionRoutine() {
  const n = S.nav
  n.state = 'INTERSECTION'
  let rule = ui().intersectionRule
  if (rule === 'alternate') { n.altFlip = !n.altFlip; rule = n.altFlip ? 'left' : 'right' }
  say(`Intersection detected. Decision: ${rule}.`, 'inter', 3)
  stopCmd()
  if (rule === 'straight') yield* driveDist(0.3, 0.3, { guard: false })
  else {
    yield* driveDist(CONFIG.irSensors.forwardOffset, 0.25, { guard: false })
    const a = rule === 'left' ? 90 : -90
    yield* turnBy(a)
    if (!irAny()) {
      say(`No path to the ${rule}. Continuing straight.`, 'inter2', 3)
      yield* turnBy(-a); yield* driveDist(0.3, 0.3, { guard: false })
    }
  }
  n.cool = 1.0
}

function* recoverLine() {
  const n = S.nav
  n.state = 'LINE_LOST · RECOVERY'
  say('Line lost. Starting recovery routine.', 'lost', 6)
  const side = n.lastSide || 1, h0 = S.pose.th
  for (const a of [side * 50, -side * 50, side * 100, -side * 100]) {
    const target = h0 + (a * Math.PI) / 180
    let t = 0
    while (t < 4) {
      if (irAny()) { say('Line found.', 'found', 3); return }
      const e = wrap(target - S.pose.th)
      if (Math.abs(e) < 0.04) break
      S.cmd.v = 0; S.cmd.w = Math.sign(e) * clamp(Math.abs(e) * 2.5, 0.3, 1.0); t += S.dt; yield
    }
  }
  if (irAny()) return
  yield* turnTo(h0)
  if (yield* driveUntil(irAny, 0.4, 0.15)) return
  say('Line not found. Stopping.', 'lostfinal', 6)
  n.halted = true; n.haltReason = 'LINE LOST'
}

function autoDrive() {
  const u = ui(), n = S.nav, ir = S.ir
  if (n.halted) { stopCmd(); n.state = `HALTED${n.haltReason ? ' · ' + n.haltReason : ''}`; return }
  const front = S.us.front
  if (front < u.stopDist) { startCo(obstacleRoutine('line'), 'OBSTACLE'); return }
  const on = ir.filter((s) => s.onLine).length
  const sum = ir.reduce((a, s) => a + s.value, 0)
  n.cool = Math.max(0, n.cool - S.dt)
  if (on >= CONFIG.irSensors.intersectionMinSensors && n.cool <= 0) { startCo(intersectionRoutine(), 'INTERSECTION'); return }
  if (sum < 0.15) {
    if (u.lineLost === 'stop') { stopCmd(); n.state = 'LINE_LOST · STOPPED'; say('Line lost. Stopping.', 'lost', 6); return }
    startCo(recoverLine(), 'LINE_RECOVERY'); return
  }
  let err = 0
  for (const s of ir) err += s.x * s.value
  err /= sum
  if (Math.abs(err) > 0.02) n.lastSide = Math.sign(err)
  let v = CONFIG.drive.maxSpeed * u.speed * 0.8 * (1 - Math.min(Math.abs(err) / 0.12, 1) * 0.5)
  if (front < u.slowDist) v *= clamp((front - u.stopDist) / (u.slowDist - u.stopDist), 0.25, 1)
  S.cmd.v = v; S.cmd.w = CONFIG.irSensors.followGain * err
  n.state = front < u.slowDist ? 'FOLLOW_LINE · SLOWING' : 'FOLLOW_LINE'
}

function manualDrive() {
  const u = ui(), k = S.keys
  let v = ((k.f ? 1 : 0) - (k.b ? 1 : 0)) * CONFIG.drive.maxSpeed * u.speed
  const w = ((k.l ? 1 : 0) - (k.r ? 1 : 0)) * CONFIG.drive.maxTurnRate * clamp(u.speed + 0.2, 0.4, 1)
  let guard = false
  if (u.collisionGuard && v > 0) {
    const f = S.us.front
    if (f < u.stopDist) { v = 0; guard = true }
    else if (f < u.slowDist) { v *= clamp((f - u.stopDist) / (u.slowDist - u.stopDist), 0.2, 1); guard = true }
  }
  S.cmd.v = v; S.cmd.w = w
  S.nav.state = guard ? (v === 0 ? 'MANUAL · OBSTACLE STOP' : 'MANUAL · SLOWING') : 'MANUAL'
  if (guard && v === 0) say('Obstacle detected ahead.', 'obstacle', 6)
}

export function runNavigation() {
  const n = S.nav
  if (S.estop) { stopCmd(); n.state = 'E-STOP'; return }
  if (n.co) {
    if (S.keys.f || S.keys.b || S.keys.l || S.keys.r) cancelCo()
    else {
      try {
        const r = n.co.next()
        if (r.done) { n.co = null; n.coName = ''; n.target = null; stopCmd() }
      } catch (e) { console.error(e); cancelCo() }
      return
    }
  }
  if (ui().mode === 'autonomous') autoDrive(); else manualDrive()
}
