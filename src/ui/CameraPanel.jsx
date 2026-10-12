import { CONFIG } from '../config/robotConfig'
import { feeds } from '../vision/feedRegistry'
import { useTelemetry } from './useTelemetry'
import { Panel, SliderRow } from './Panel'
import * as A from '../sim/actions'

export default function CameraPanel() {
  const t = useTelemetry(200)
  const C = CONFIG.camera
  return (
    <Panel title="Dual camera vision">
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {['left', 'right'].map((k) => (
          <canvas key={k} ref={(el) => { feeds[k] = el }} width={256} height={144} className="w-full rounded border border-cyan-500/30 bg-black" />
        ))}
      </div>
      <SliderRow label="Head pan" value={t.head.pan} min={-C.panLimit} max={C.panLimit} unit="°" onChange={(v) => A.headSet({ pan: v })} />
      <SliderRow label="Head tilt" value={t.head.tilt} min={-C.tiltLimit} max={C.tiltLimit} unit="°" onChange={(v) => A.headSet({ tilt: v })} />
      <p className="text-[10px] text-slate-500 leading-snug">Feeds are real renders from each lens. Bounding boxes come from scene metadata (not computer vision); the detector interface is ready for OpenCV/YOLO.</p>
    </Panel>
  )
}
