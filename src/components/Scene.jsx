import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { CONFIG } from '../config/robotConfig'
import { S } from '../sim/state'
import { stepSim } from '../sim/engine'
import { toWorld } from '../sim/sensors'
import { useUI } from '../store/uiStore'
import { rig, feeds } from '../vision/feedRegistry'
import Robot from './robot/Robot'
import Overlay from './robot/Overlay'
import Environment3D from './Environment3D'

function SimLoop() { useFrame((_, dt) => stepSim(Math.min(dt, 0.1))); return null }

// ── viewing modes ──────────────────────────────────────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree()
  const view = useUI((s) => s.view)
  const controls = useRef()
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), q: new THREE.Quaternion(), flip: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI) }), [])
  useEffect(() => { camera.layers.enable(1) }, [camera])
  useEffect(() => {
    const p = S.pose, s = Math.sin(p.th), c = Math.cos(p.th)
    const target = new THREE.Vector3(p.x, 0.25, p.z)
    camera.fov = view === 'fp' ? CONFIG.camera.vfov : 50
    camera.updateProjectionMatrix(); camera.up.set(0, 1, 0)
    if (view === 'orbit') { camera.position.set(6.5, 5.5, 7.5); target.set(0, 0, 0) }
    if (view === 'front') camera.position.set(p.x + s * 2.0, 0.8, p.z + c * 2.0)
    if (view === 'side') camera.position.set(p.x + c * 2.0, 0.7, p.z - s * 2.0)
    if (view === 'top') { camera.position.set(0, 12.5, 0.01); target.set(0, 0, 0) }
    if (controls.current && view !== 'follow' && view !== 'fp') { controls.current.target.copy(target); controls.current.update() }
  }, [view, camera])
  useFrame(() => {
    const p = S.pose
    if (view === 'follow') {
      const s = Math.sin(p.th), c = Math.cos(p.th)
      tmp.v.set(p.x - s * 1.5, 0.95, p.z - c * 1.5)
      camera.position.lerp(tmp.v, 0.12); camera.lookAt(p.x + s * 0.4, 0.25, p.z + c * 0.4)
    } else if (view === 'fp' && rig.lensL) {
      rig.lensL.updateWorldMatrix(true, false)
      rig.lensL.getWorldPosition(camera.position); rig.lensL.getWorldQuaternion(tmp.q)
      camera.quaternion.copy(tmp.q).multiply(tmp.flip)
    }
  })
  return <OrbitControls ref={controls} makeDefault enabled={view !== 'follow' && view !== 'fp'} maxPolarAngle={Math.PI * 0.499} minDistance={0.4} maxDistance={25} enableDamping />
}

// ── live stereo camera feeds: render the scene from each lens into an offscreen target ─────────────
const FW = 256, FH = 144
function CameraFeeds() {
  const { gl, scene } = useThree()
  const rt = useMemo(() => new THREE.WebGLRenderTarget(FW, FH), [])
  const cams = useMemo(() => [0, 1].map(() => new THREE.PerspectiveCamera(CONFIG.camera.vfov, FW / FH, 0.03, 40)), [])
  const buf = useMemo(() => new Uint8Array(FW * FH * 4), [])
  const img = useMemo(() => new ImageData(FW, FH), [])
  const lut = useMemo(() => Uint8ClampedArray.from({ length: 256 }, (_, i) => 255 * Math.pow(i / 255, 1 / 2.2)), [])
  const tmp = useMemo(() => ({ q: new THREE.Quaternion(), flip: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), v: new THREE.Vector3() }), [])
  const acc = useRef(0)

  function boxes(ctx, cam, k) {
    ctx.lineWidth = 1.5; ctx.font = '9px monospace'
    for (const d of S.detections) {
      const b = d.bounds, xs = [], ys = []
      let behind = false
      for (const ix of [-1, 1]) for (const iy of [0, 1]) for (const iz of [-1, 1]) {
        tmp.v.set(b.cx + (ix * b.sx) / 2, iy * b.sy, b.cz + (iz * b.sz) / 2)
        tmp.v.applyMatrix4(cam.matrixWorldInverse)
        if (tmp.v.z > -0.03) { behind = true; break }
        tmp.v.applyMatrix4(cam.projectionMatrix)
        xs.push((tmp.v.x * 0.5 + 0.5) * FW); ys.push((1 - (tmp.v.y * 0.5 + 0.5)) * FH)
      }
      if (behind) continue
      const x0 = Math.max(0, Math.min(...xs)), x1 = Math.min(FW, Math.max(...xs)), y0 = Math.max(0, Math.min(...ys)), y1 = Math.min(FH, Math.max(...ys))
      if (x1 <= x0 || y1 <= y0) continue
      const col = d.kind === 'person' ? '#34d399' : d.kind === 'box' ? '#fbbf24' : d.kind === 'wall' || d.kind === 'station' ? '#60a5fa' : '#f87171'
      ctx.strokeStyle = col; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0)
      const txt = `${d.label} ${d.dist.toFixed(1)}m ${(d.conf * 100).toFixed(0)}%`
      const tw = ctx.measureText(txt).width + 4
      ctx.fillStyle = col; ctx.fillRect(x0, Math.max(0, y0 - 11), tw, 11)
      ctx.fillStyle = '#020617'; ctx.fillText(txt, x0 + 2, Math.max(9, y0 - 2))
    }
    ctx.fillStyle = '#22d3ee'; ctx.fillText(k === 0 ? 'L-CAM' : 'R-CAM', 5, 12)
    ctx.fillStyle = 'rgba(248,250,252,.55)'; ctx.fillText('SIMULATED DETECTION · scene metadata', 5, FH - 5)
  }

  useFrame((_, dt) => {
    acc.current += dt
    if (acc.current < 1 / 12) return
    acc.current = 0
    const lenses = [rig.lensL, rig.lensR], names = ['left', 'right']
    for (let k = 0; k < 2; k++) {
      const cv = feeds[names[k]], lens = lenses[k]
      if (!cv || !lens) continue
      const cam = cams[k]
      lens.updateWorldMatrix(true, false)
      lens.getWorldPosition(cam.position); lens.getWorldQuaternion(tmp.q)
      cam.quaternion.copy(tmp.q).multiply(tmp.flip); cam.updateMatrixWorld(true)
      const prev = gl.getRenderTarget()
      gl.setRenderTarget(rt); gl.render(scene, cam); gl.readRenderTargetPixels(rt, 0, 0, FW, FH, buf); gl.setRenderTarget(prev)
      const d = img.data
      for (let y = 0; y < FH; y++) {
        const src = (FH - 1 - y) * FW * 4, dst = y * FW * 4
        for (let x = 0; x < FW * 4; x += 4) { d[dst + x] = lut[buf[src + x]]; d[dst + x + 1] = lut[buf[src + x + 1]]; d[dst + x + 2] = lut[buf[src + x + 2]]; d[dst + x + 3] = 255 }
      }
      const ctx = cv.getContext('2d')
      ctx.putImageData(img, 0, 0); boxes(ctx, cam, k)
    }
  })
  return null
}

// ── debug visualisation (sensor rays, heading, collision boundary, nav target, arm tip) ────────────
function Beam({ get, color = '#22d3ee' }) {
  const g = useRef()
  useFrame(() => {
    const r = get()
    if (!r) { g.current.visible = false; return }
    g.current.visible = true; g.current.position.set(r.x, r.y, r.z); g.current.rotation.y = Math.atan2(r.dx, r.dz); g.current.scale.set(1, 1, r.len)
  })
  return <group ref={g}><mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.004, 0.004, 1, 6]} /><meshBasicMaterial color={color} /></mesh></group>
}
function DebugOverlay() {
  const on = useUI((s) => s.debug)
  const ring = useRef(), target = useRef(), tip = useRef()
  useFrame(() => {
    if (!ring.current) return
    ring.current.position.set(S.pose.x, 0.01, S.pose.z)
    target.current.visible = !!S.nav.target
    if (S.nav.target) target.current.position.set(S.nav.target.x, 0.02, S.nav.target.z)
    tip.current.position.set(S.tip.x, S.tip.y, S.tip.z)
  })
  if (!on) return null
  const us = CONFIG.ultrasonic
  const usBeam = (key) => () => {
    const c = us.sensors[key], o = toWorld(S.pose, c.x, c.z), a = S.pose.th + (c.yaw * Math.PI) / 180
    return { x: o.x, y: c.y, z: o.z, dx: Math.sin(a), dz: Math.cos(a), len: S.us[key] }
  }
  return (
    <Overlay>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[CONFIG.chassis.collisionRadius - 0.006, CONFIG.chassis.collisionRadius, 48]} /><meshBasicMaterial color="#f59e0b" /></mesh>
      <mesh ref={target} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.08, 0.1, 24]} /><meshBasicMaterial color="#22d3ee" /></mesh>
      <mesh ref={tip}><sphereGeometry args={[0.02, 12, 12]} /><meshBasicMaterial color="#f43f5e" /></mesh>
      <Beam color="#34d399" get={() => ({ x: S.pose.x, y: 0.2, z: S.pose.z, dx: Math.sin(S.pose.th), dz: Math.cos(S.pose.th), len: 0.9 })} />
      <Beam get={usBeam('front')} color="#f43f5e" /><Beam get={usBeam('left')} color="#f43f5e" /><Beam get={usBeam('right')} color="#f43f5e" />
    </Overlay>
  )
}

export default function Scene() {
  return (
    <Canvas shadows camera={{ position: [6.5, 5.5, 7.5], fov: 50, near: 0.05, far: 100 }} gl={{ antialias: true }}>
      <color attach="background" args={['#0b1020']} />
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#bcd8ff', '#1b2233', 0.5]} />
      <directionalLight position={[4, 8, 3]} intensity={1.7} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-far={25} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} position={[0, 5, -5]} scale={[10, 4, 1]} color="#bfe9ff" />
        <Lightformer form="rect" intensity={1.2} position={[-5, 3, 3]} scale={[6, 3, 1]} color="#ffffff" />
        <Lightformer form="ring" intensity={2} position={[5, 2, 2]} scale={4} color="#22d3ee" />
      </Environment>
      <SimLoop />
      <Environment3D />
      <Robot />
      <DebugOverlay />
      <CameraRig />
      <CameraFeeds />
    </Canvas>
  )
}
