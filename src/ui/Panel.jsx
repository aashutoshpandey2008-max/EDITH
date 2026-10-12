import { useEffect, useRef, useState } from 'react'

export function Panel({ title, right, children }) {
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-900/70 p-3 mb-3 shadow-[0_0_20px_rgba(34,211,238,0.04)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] tracking-[0.18em] uppercase text-cyan-300 font-semibold">{title}</h3>{right}
      </div>
      {children}
    </section>
  )
}

export function Btn({ children, onClick, onDown, onUp, active, danger, className = '', title }) {
  const base = 'px-2 py-1.5 rounded-md text-xs font-medium border transition select-none touch-none '
  const tone = danger ? 'bg-red-600/80 border-red-400 hover:bg-red-500 text-white'
    : active ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100' : 'bg-slate-800/80 border-slate-600 hover:border-cyan-500/60 text-slate-200'
  return (
    <button title={title} className={base + tone + ' ' + className} onClick={onClick}
      onPointerDown={onDown ? (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); onDown() } : undefined}
      onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp}>
      {children}
    </button>
  )
}

export function SliderRow({ label, value, min, max, step = 1, unit = '', onChange, fmt }) {
  const [drag, setDrag] = useState(null)
  const shown = drag ?? value
  return (
    <label className="block mb-2">
      <div className="flex justify-between text-[11px] text-slate-400 mb-0.5"><span>{label}</span><span className="mono text-cyan-200">{fmt ? fmt(shown) : Number(shown).toFixed(step < 1 ? 2 : 0)}{unit}</span></div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={shown}
        onPointerDown={() => setDrag(value)} onPointerUp={() => setDrag(null)}
        onChange={(e) => { const v = +e.target.value; setDrag(v); onChange(v) }} />
    </label>
  )
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-cyan-400" />{label}
    </label>
  )
}

export function useLatest(v) { const r = useRef(v); useEffect(() => { r.current = v }); return r }
