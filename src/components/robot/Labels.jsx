import { Html } from '@react-three/drei'
import { useUI } from '../../store/uiStore'
import { useTelemetry } from '../../ui/useTelemetry'

const items = [
  ['Chassis', [0, 0.1, -0.1]], ['IR array', [0, 0.04, 0.3]], ['Ultrasonic', [0, 0.14, 0.36]],
  ['Camera head L/R', [0, 0.52, 0.2]], ['Microphone', [0.12, 0.42, 0.17]], ['Speaker', [-0.14, 0.24, -0.2]],
  ['Slew base', [-0.17, 0.2, 0]], ['Wheel', [0.3, 0.07, 0.17]],
]
function Tag({ text, position }) {
  return <Html position={position} center distanceFactor={3.5} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
    <div className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900/85 border border-cyan-400/50 text-cyan-200 whitespace-nowrap mono">{text}</div>
  </Html>
}
export default function Labels() {
  const on = useUI((s) => s.labels)
  if (!on) return null
  return <group>{items.map(([t, p]) => <Tag key={t} text={t} position={p} />)}</group>
}

export function DebugTag() {
  const on = useUI((s) => s.debug)
  const t = useTelemetry(150)
  if (!on) return null
  return <Html position={[0, 0.95, 0]} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
    <div className="text-[9px] leading-tight px-2 py-1 rounded bg-slate-950/90 border border-amber-400/60 text-amber-200 mono whitespace-pre">
      {`STATE ${t.nav}\nARM yaw ${(((t.arm.yaw % 360) + 360) % 360).toFixed(0)}° boom ${t.arm.boom.toFixed(0)}° ext ${(t.arm.ext * 100).toFixed(0)}cm\nPOSE ${t.pose.x.toFixed(2)}, ${t.pose.z.toFixed(2)}  hdg ${((t.pose.th * 180) / Math.PI).toFixed(0)}°`}
    </div>
  </Html>
}
