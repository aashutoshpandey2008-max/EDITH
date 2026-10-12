import { useUI } from '../store/uiStore'
import { S } from '../sim/state'

// Browser text-to-speech (SpeechSynthesis). Silently skipped when unsupported or muted.
export function speakRaw(text) {
  const ui = useUI.getState()
  if (!ui.voiceOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.volume = ui.volume; u.rate = 1.05; u.pitch = 0.9
    u.onstart = () => { S.speaking = true }
    u.onend = () => { S.speaking = false }
    u.onerror = () => { S.speaking = false }
    if (window.speechSynthesis.pending) window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch (e) { /* ignore */ }
}

// Robot says something: shown in the console and spoken. `key`+`cooldown` (sim seconds) prevent spam.
export function say(text, key = null, cooldown = 0) {
  if (key) {
    const last = S.say[key] ?? -1e9
    if (S.time - last < cooldown) return
    S.say[key] = S.time
  }
  useUI.getState().addLog('robot', text)
  speakRaw(text)
}
