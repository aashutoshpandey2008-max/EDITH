import { create } from 'zustand'
let logId = 0
export const useUI = create((set) => ({
  running: true, scenario: 'A', mode: 'manual', speed: 0.6, view: 'orbit',
  debug: false, labels: false, showCones: true, showFov: true,
  stopDist: 0.25, slowDist: 0.8, intersectionRule: 'straight', lineLost: 'recover', collisionGuard: true,
  voiceOn: true, volume: 0.8, listening: false,
  log: [], worldVersion: 0,
  patch: (p) => set(p),
  addLog: (who, text) => set((s) => ({ log: [...s.log.slice(-79), { id: ++logId, who, text }] })),
  bump: () => set((s) => ({ worldVersion: s.worldVersion + 1 })),
}))
