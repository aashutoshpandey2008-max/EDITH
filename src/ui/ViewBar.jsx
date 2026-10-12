import { useUI } from '../store/uiStore'
import { Btn } from './Panel'

const VIEWS = [['orbit', 'Orbit'], ['front', 'Front'], ['side', 'Side'], ['top', 'Top'], ['follow', 'Follow'], ['fp', 'First-person']]
export default function ViewBar() {
  const view = useUI((s) => s.view), patch = useUI((s) => s.patch)
  return (
    <div className="absolute top-2 left-2 flex flex-wrap gap-1 bg-slate-950/70 border border-cyan-500/20 rounded-lg p-1 backdrop-blur">
      {VIEWS.map(([k, l]) => <Btn key={k} active={view === k} onClick={() => patch({ view: k })}>{l}</Btn>)}
    </div>
  )
}
