import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { loadScenario } from './sim/actions'

class ErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error(error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#fca5a5', fontFamily: 'monospace', background: '#020617', height: '100%', overflow: 'auto' }}>
          <h2 style={{ color: '#22d3ee' }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error && (this.state.error.stack || this.state.error))}</pre>
          <p>Check the browser console (F12). WebGL must be enabled for the 3D view.</p>
        </div>
      )
    }
    return this.props.children
  }
}

try {
  loadScenario('A', { silent: true })
  ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>)
  window.__booted = true
  const boot = document.getElementById('boot')
  if (boot) boot.style.display = 'none'
} catch (e) {
  window.__failed = true
  console.error(e)
  window.__bootError && window.__bootError(e && (e.stack || e))
}
