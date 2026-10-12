import { useEffect, useState } from 'react'
import { snapshot } from '../sim/engine'

// Polls the mutable simulation state at a low rate so React panels re-render cheaply.
export function useTelemetry(ms = 120) {
  const [t, setT] = useState(() => snapshot())
  useEffect(() => { const id = setInterval(() => setT(snapshot()), ms); return () => clearInterval(id) }, [ms])
  return t
}
