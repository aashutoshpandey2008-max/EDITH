import { CONFIG } from '../config/robotConfig'
import { useUI } from '../store/uiStore'
import { useTelemetry } from './useTelemetry'
import { Btn, Panel, SliderRow, Toggle } from './Panel'
import { SCENARIOS } from '../sim/scenarios'
import * as A from '../sim/actions'

const A_ = CONFIG.arm

export function SimControls() {
  const ui = useUI()
  const sc = SCENARIOS[ui.scenario]
  return (
    <Panel title="Simulation">
      <select className="w-full bg-slate-800 border border-slate-600 rounded-md text-xs p-1.5 mb-2" value={ui.scenario} onChange={(e) => A.loadScenario(e.target.value)}>
        {Object.entries(SCENARIOS).map(([k, s]) => <option key={k} value={k}>{s.name}</option>)}
      </select>
      <p className="text-[11px] text-slate-400 mb-2 leading-snug">{sc.hint}</p>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <Btn onClick={A.togglePause} active={!ui.running}>{ui.running ? '⏸ Pause' : '▶ Start'}</Btn>
        <Btn onClick={A.resetSim}>↺ Reset</Btn>
        <Btn onClick={A.runPickAndPlace} className={ui.scenario === 'E' ? 'ring-1 ring-cyan-400' : ''}>⚙ Pick&amp;Place</Btn>
        <Btn onClick={A.addObstacle}>＋ Obstacle</Btn>
        <Btn onClick={A.removeObstacle}>－ Obstacle</Btn>
        <Btn onClick={A.returnHome}>⌂ Home</Btn>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Toggle label="Debug mode" checked={ui.debug} onChange={(v) => ui.patch({ debug: v })} />
        <Toggle label="Labels" checked={ui.labels} onChange={(v) => ui.patch({ labels: v })} />
        <Toggle label="Sonar cones" checked={ui.showCones} onChange={(v) => ui.patch({ showCones: v })} />
        <Toggle label="Camera FOV" checked={ui.showFov} onChange={(v) => ui.patch({ showFov: v })} />
      </div>
    </Panel>
  )
}

const hold = (k) => ({ onDown: () => A.key(k, true), onUp: () => A.key(k, false) })

export function RobotControls() {
  const ui = useUI()
  const t = useTelemetry(200)
  return (
    <Panel title="Robot controls" right={<span className="text-[10px] mono text-slate-400">{t.nav}</span>}>
      <div className="flex gap-1.5 mb-2">
        <Btn className="flex-1" active={ui.mode === 'manual'} onClick={() => A.setMode('manual')}>Manual</Btn>
        <Btn className="flex-1" active={ui.mode === 'autonomous'} onClick={() => A.setMode('autonomous')}>Autonomous</Btn>
      </div>
      <div className="grid grid-cols-3 gap-1.5 w-40 mx-auto mb-2">
        <span /><Btn {...hold('f')}>▲</Btn><span />
        <Btn {...hold('l')}>◀</Btn><Btn onClick={A.stopRobot} title="Stop">■</Btn><Btn {...hold('r')}>▶</Btn>
        <span /><Btn {...hold('b')}>▼</Btn><span />
      </div>
      <p className="text-center text-[10px] text-slate-500 mb-2">Keys: WASD / arrows · Space = E-stop</p>
      <SliderRow label="Speed" value={ui.speed} min={0.1} max={1} step={0.05} onChange={(v) => ui.patch({ speed: v })} fmt={(v) => (v * CONFIG.drive.maxSpeed).toFixed(2) + ' m/s'} />
      {t.estop
        ? <Btn className="w-full py-2.5 !bg-amber-500/80 !border-amber-300 text-black font-bold" onClick={A.releaseEstop}>RELEASE E-STOP</Btn>
        : <Btn danger className="w-full py-2.5 font-bold tracking-wider" onClick={A.emergencyStop}>⛔ EMERGENCY STOP</Btn>}
      <details className="mt-3 text-[11px] text-slate-300">
        <summary className="cursor-pointer text-cyan-300">Navigation settings</summary>
        <div className="mt-2">
          <SliderRow label="Stop distance" value={ui.stopDist * 100} min={10} max={60} step={1} unit=" cm" onChange={(v) => ui.patch({ stopDist: v / 100 })} />
          <SliderRow label="Slow-down distance" value={ui.slowDist * 100} min={30} max={200} step={5} unit=" cm" onChange={(v) => ui.patch({ slowDist: v / 100 })} />
          <label className="block mb-2">Intersection rule
            <select className="w-full bg-slate-800 border border-slate-600 rounded p-1 mt-0.5" value={ui.intersectionRule} onChange={(e) => ui.patch({ intersectionRule: e.target.value })}>
              <option value="straight">Go straight</option><option value="left">Turn left</option><option value="right">Turn right</option><option value="alternate">Alternate L/R</option>
            </select>
          </label>
          <label className="block mb-2">When the line is lost
            <select className="w-full bg-slate-800 border border-slate-600 rounded p-1 mt-0.5" value={ui.lineLost} onChange={(e) => ui.patch({ lineLost: e.target.value })}>
              <option value="recover">Run recovery sweep</option><option value="stop">Stop</option>
            </select>
          </label>
          <Toggle label="Manual-mode collision guard (ultrasonic)" checked={ui.collisionGuard} onChange={(v) => ui.patch({ collisionGuard: v })} />
        </div>
      </details>
    </Panel>
  )
}

const mod360 = (v) => ((v % 360) + 360) % 360

export function ArmControls() {
  const t = useTelemetry(120)
  const a = t.arm
  return (
    <Panel title="Crane arm" right={a.limited ? <span className="text-[10px] text-amber-300">⚠ {a.limited}</span> : null}>
      <SliderRow label="Base rotation (continuous 360°)" value={mod360(a.t.yaw)} min={0} max={360} step={1} unit="°" onChange={A.armYawToDeg} />
      <SliderRow label="Boom elevation" value={a.t.boom} min={A_.boomMin} max={A_.boomMax} step={1} unit="°" onChange={(v) => A.armTarget({ boom: v })} />
      <SliderRow label="Telescopic extension" value={a.t.ext * 100} min={0} max={A_.extMax * 100} step={1} unit=" cm" onChange={(v) => A.armTarget({ ext: v / 100 })} />
      <SliderRow label="Gripper opening" value={a.t.grip * 100} min={0} max={100} step={1} unit="%" onChange={(v) => A.armTarget({ grip: v / 100 })} />
      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        <Btn onDown={() => A.armHold('yaw', -1)} onUp={() => A.armRelease('yaw')}>↻ Rotate CW</Btn>
        <Btn onDown={() => A.armHold('yaw', 1)} onUp={() => A.armRelease('yaw')}>↺ Rotate CCW</Btn>
        <Btn onDown={() => A.armHold('boom', 1)} onUp={() => A.armRelease('boom')}>⤒ Raise boom</Btn>
        <Btn onDown={() => A.armHold('boom', -1)} onUp={() => A.armRelease('boom')}>⤓ Lower boom</Btn>
        <Btn onDown={() => A.armHold('ext', 1)} onUp={() => A.armRelease('ext')}>⇥ Extend</Btn>
        <Btn onDown={() => A.armHold('ext', -1)} onUp={() => A.armRelease('ext')}>⇤ Retract</Btn>
        <Btn onClick={() => A.gripper(true)}>✋ Open</Btn>
        <Btn onClick={() => A.gripper(false)}>✊ Close</Btn>
        <Btn onClick={A.armSpin360}>⟳ Full 360°</Btn>
        <Btn onClick={A.armHome}>⌂ Home arm</Btn>
      </div>
      <div className="text-[10px] mono text-slate-400 mt-1">
        stability {(t.stability * 100).toFixed(0)}% · payload {t.payload ? `${t.payload.id} (${t.payload.mass} kg)` : 'none'} · max {A_.maxPayload} kg
      </div>
      <p className="text-[10px] text-amber-300/80 mt-1 leading-snug">Hardware note: continuous 360° rotation needs a slip ring (or limited rotation / cable wrap) on the real robot.</p>
    </Panel>
  )
}
