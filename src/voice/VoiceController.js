// VoiceController — microphone input via the browser Web Speech API (Chrome/Edge; needs localhost or HTTPS)
// with a typed-command fallback that uses exactly the same command path.
import { useUI } from '../store/uiStore'
import { executeText } from './commands'

let rec = null
const SR = () => (typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition)

export const VoiceController = {
  supported: () => !!SR(),
  submitText: (t) => executeText(t),
  start() {
    const Ctor = SR(), ui = useUI.getState()
    if (!Ctor) { ui.addLog('system', 'Speech recognition is not supported in this browser. Use Chrome/Edge or type commands below.'); return }
    if (rec) return
    rec = new Ctor()
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = false
    rec.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) executeText(e.results[i][0].transcript) }
    rec.onerror = (e) => {
      useUI.getState().addLog('system', `Microphone error: ${e.error}. Use the text box as a fallback.`)
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { useUI.getState().patch({ listening: false }); rec = null }
    }
    rec.onend = () => { if (useUI.getState().listening && rec) { try { rec.start() } catch (_) { /* already started */ } } else rec = null }
    try { rec.start(); ui.patch({ listening: true }); ui.addLog('system', 'Listening… say e.g. "Robot, move forward".') } catch (e) { rec = null }
  },
  stop() {
    useUI.getState().patch({ listening: false })
    if (rec) { try { rec.stop() } catch (_) { /* ignore */ } rec = null }
  },
}
