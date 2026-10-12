import { useEffect } from 'react'
import Scene from './components/Scene'
import ViewBar from './ui/ViewBar'
import SensorDashboard from './ui/SensorDashboard'
import CameraPanel from './ui/CameraPanel'
import VoicePanel from './ui/VoicePanel'
import { SimControls, RobotControls, ArmControls } from './ui/ControlPanels'
import { useTelemetry } from './ui/useTelemetry'
import { useUI } from './store/uiStore'
import * as A from './sim/actions'

const KEYS = { w: 'f', arrowup: 'f', s: 'b', arrowdown: 'b', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r' }

export default function App() {
  const t = useTelemetry(200)
  const { mode, running } = useUI()
  useEffect(() => {
    const typing = (e) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && e.target.type !== 'range'
    const down = (e) => {
      if (typing(e)) return
      const k = e.key.toLowerCase()
      if (e.code === 'Space') { e.preventDefault(); A.emergencyStop(); return }
      if (KEYS[k]) { e.preventDefault(); A.key(KEYS[k], true) }
    }
    const up = (e) => { const k = e.key.toLowerCase(); if (KEYS[k]) A.key(KEYS[k], false) }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])
  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/20 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          <h1 className="text-sm font-semibold tracking-[0.25em] text-cyan-200">VISHWAKARMA <span className="text-slate-500 font-normal">· ROBOT DIGITAL TWIN</span></h1>
        </div>
        <div className="flex items-center gap-4 text-[11px] mono text-slate-400">
          {t.estop && <span className="px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">E-STOP</span>}
          <span>MODE <b className="text-cyan-200">{mode.toUpperCase()}</b></span>
          <span>SIM <b className={running ? 'text-emerald-300' : 'text-amber-300'}>{running ? 'RUNNING' : 'PAUSED'}</b></span>
          <span className="hidden md:inline">t = {t.time.toFixed(1)} s</span>
        </div>
      </header>
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <aside className="lg:w-80 shrink-0 overflow-y-auto p-3 border-r border-cyan-500/10 order-2 lg:order-1">
          <SimControls /><RobotControls /><ArmControls />
        </aside>
        <main className="relative flex-1 min-h-[45vh] order-1 lg:order-2">
          <Scene />
          <ViewBar />
        </main>
        <aside className="lg:w-96 shrink-0 overflow-y-auto p-3 border-l border-cyan-500/10 order-3">
          <SensorDashboard /><CameraPanel /><VoicePanel />
        </aside>
      </div>
    </div>
  )
}
