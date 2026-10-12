import { useEffect, useRef, useState } from 'react'
import { useUI } from '../store/uiStore'
import { VoiceController } from '../voice/VoiceController'
import { Btn, Panel, SliderRow, Toggle } from './Panel'

const EXAMPLES = ['move forward', 'turn left', 'stop', 'activate autonomous mode', 'switch to manual mode', 'rotate arm 90 degrees', 'rotate arm 360 degrees', 'raise the arm', 'lower the arm', 'extend the arm', 'pick up the object', 'return to home position', 'what is in front of you', 'report sensor status']

export default function VoicePanel() {
  const ui = useUI()
  const [text, setText] = useState('')
  const box = useRef()
  useEffect(() => { box.current?.scrollTo(0, box.current.scrollHeight) }, [ui.log.length])
  const submit = () => { if (text.trim()) { VoiceController.submitText(text); setText('') } }
  const supported = VoiceController.supported()
  return (
    <Panel title="Voice interaction">
      <div className="flex gap-1.5 mb-2">
        <Btn className="flex-1" active={ui.listening} onClick={() => (ui.listening ? VoiceController.stop() : VoiceController.start())} title={supported ? '' : 'Speech recognition not supported in this browser'}>
          {ui.listening ? '🎙 Listening… (tap to stop)' : '🎙 Microphone'}
        </Btn>
        <Btn active={!ui.voiceOn} onClick={() => { if (ui.voiceOn) window.speechSynthesis?.cancel(); ui.patch({ voiceOn: !ui.voiceOn }) }}>{ui.voiceOn ? '🔊 On' : '🔇 Muted'}</Btn>
      </div>
      {!supported && <div className="text-[10px] text-amber-300 mb-1">Speech recognition unavailable here (use Chrome/Edge). Text commands still work.</div>}
      <SliderRow label="Voice volume" value={ui.volume} min={0} max={1} step={0.05} onChange={(v) => ui.patch({ volume: v })} fmt={(v) => (v * 100).toFixed(0) + '%'} />
      <div ref={box} className="h-40 overflow-auto rounded-md bg-slate-950/80 border border-slate-700 p-2 text-[11px] mono space-y-1">
        {ui.log.length === 0 && <div className="text-slate-500">Console — commands &amp; responses appear here.</div>}
        {ui.log.map((l) => (
          <div key={l.id} className={l.who === 'user' ? 'text-emerald-300' : l.who === 'robot' ? 'text-cyan-200' : 'text-amber-300'}>
            <span className="opacity-60">{l.who === 'user' ? '› you  ' : l.who === 'robot' ? '‹ robot ' : '! sys   '}</span>{l.text}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        <input className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-xs" placeholder='Type a command, e.g. "robot, move forward"' value={text}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
        <Btn onClick={submit}>Send</Btn>
      </div>
      <details className="mt-2 text-[11px] text-slate-400">
        <summary className="cursor-pointer text-cyan-300">Example commands</summary>
        <div className="flex flex-wrap gap-1 mt-1.5">{EXAMPLES.map((e) => <button key={e} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 hover:border-cyan-500/60" onClick={() => VoiceController.submitText(e)}>{e}</button>)}</div>
      </details>
    </Panel>
  )
}
