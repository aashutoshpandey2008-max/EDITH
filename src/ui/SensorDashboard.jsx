import { CONFIG } from '../config/robotConfig'
import { useUI } from '../store/uiStore'
import { useTelemetry } from './useTelemetry'
import { Panel } from './Panel'

const NAMES = { farLeft: 'FL', left: 'L', center: 'C', right: 'R', farRight: 'FR' }

export default function SensorDashboard() {
  const t = useTelemetry(100)
  const ui = useUI()
  const mx = CONFIG.ultrasonic.maxRange
  const bar = (d) => {
    const c = d < ui.stopDist ? 'bg-red-500' : d < ui.slowDist ? 'bg-amber-400' : 'bg-cyan-400'
    return <div className="h-1.5 bg-slate-800 rounded overflow-hidden"><div className={`h-full ${c}`} style={{ width: `${Math.min(100, (d / mx) * 100)}%` }} /></div>
  }
  const cm = (d) => (d >= mx - 0.01 ? `>${(mx * 100).toFixed(0)}` : (d * 100).toFixed(0))
  return (
    <Panel title="Sensors &amp; telemetry">
      <div className="text-[10px] text-slate-400 mb-1">IR line sensors (line = black tape; IR is not used for obstacles)</div>
      <div className="grid grid-cols-5 gap-1 mb-3">
        {t.ir.map((s) => (
          <div key={s.name} className={`rounded-md border text-center py-1 ${s.on ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-700 bg-slate-800/60'}`}>
            <div className="text-[10px] text-slate-400">{NAMES[s.name]}</div>
            <div className="mono text-xs text-cyan-200">{(s.value * 100).toFixed(0)}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-400 mb-1">Ultrasonic distance (cm)</div>
      {['front', 'left', 'right'].map((k) => (
        <div key={k} className="mb-1.5">
          <div className="flex justify-between text-[11px]"><span className="capitalize text-slate-300">{k}</span><span className="mono text-cyan-200">{cm(t.us[k])}</span></div>{bar(t.us[k])}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] mono mt-2 text-slate-300">
        <span>state</span><span className="text-cyan-200 text-right truncate">{t.nav}</span>
        <span>task</span><span className="text-cyan-200 text-right">{t.task || '—'}</span>
        <span>pos</span><span className="text-right">{t.pose.x.toFixed(2)}, {t.pose.z.toFixed(2)} m</span>
        <span>heading</span><span className="text-right">{((t.pose.th * 180) / Math.PI).toFixed(0)}°</span>
        <span>speed</span><span className="text-right">{t.v.toFixed(2)} m/s</span>
        <span>collision</span><span className={`text-right ${t.collision ? 'text-red-400' : ''}`}>{t.collision ? 'YES' : 'no'}</span>
        <span>delivered</span><span className="text-right">{t.delivered}/{t.boxes}</span>
      </div>
      <div className="text-[10px] text-slate-400 mt-3 mb-1">Detected objects <span className="text-amber-300/80">(simulated · scene metadata)</span></div>
      <div className="space-y-0.5 max-h-24 overflow-auto">
        {t.detections.length === 0 && <div className="text-[11px] text-slate-500">nothing in view</div>}
        {t.detections.map((d) => <div key={d.id} className="flex justify-between text-[11px] mono"><span>{d.label} <span className="text-slate-500">{d.id}</span></span><span className="text-cyan-200">{d.dist.toFixed(2)} m · {(d.conf * 100).toFixed(0)}%</span></div>)}
      </div>
    </Panel>
  )
}
