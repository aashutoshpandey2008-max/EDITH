import { useLayoutEffect, useRef } from 'react'
// Children are moved to render layer 1: visible in the main view, hidden from the robot's camera feeds.
export default function Overlay({ visible = true, children }) {
  const ref = useRef()
  useLayoutEffect(() => { ref.current?.traverse((o) => o.layers.set(1)) })
  return visible ? <group ref={ref}>{children}</group> : null
}
