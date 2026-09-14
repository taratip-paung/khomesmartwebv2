import { Component } from 'react'
import { useLang } from '../i18n/LangContext'

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

/** Static stand-in when WebGL is unavailable or the scene throws. */
export function StaticFallback() {
  const { ui } = useLang()
  return (
    <div className="fallback" role="img" aria-label="KHOME SMART smart ecosystem illustration">
      <svg className="fallback__art" viewBox="0 0 520 320" fill="none" stroke="#35d6ff" strokeWidth="1.2" opacity="0.9">
        <ellipse cx="260" cy="250" rx="230" ry="50" opacity="0.5" />
        <ellipse cx="260" cy="250" rx="200" ry="42" opacity="0.25" />
        <path d="M200 230V150l60-40 60 40v80z" />
        <path d="M200 150l60-40 60 40M230 150l30-20 30 20" opacity="0.8" />
        <path d="M262 112l40 26M270 106l40 26M278 100l40 26" stroke="#ffc857" />
        <path d="M410 220V90l8-4 8 4v130M402 120h32M404 150h28M406 180h24" />
        <circle cx="418" cy="80" r="10" opacity="0.6" />
        <circle cx="418" cy="80" r="20" opacity="0.35" />
        <path d="M90 230v-60l10-6 10 6v60M85 170h30" stroke="#7cf5c2" />
        <rect x="330" y="180" width="26" height="50" stroke="#a78bfa" />
        <rect x="360" y="180" width="26" height="50" stroke="#a78bfa" />
        <circle cx="358" cy="140" r="14" stroke="#a78bfa" />
        <path d="M260 110 Q180 60 100 164M260 110 Q340 60 418 90M260 110 Q320 120 358 140" opacity="0.5" strokeDasharray="4 4" />
      </svg>
      <div className="fallback__note glass">
        <strong>{ui.fallback.title}</strong>
        <br />
        {ui.fallback.body}
      </div>
    </div>
  )
}

export class SceneErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.error('[KHOME] 3D scene failed, showing fallback', err)
    this.props.onFail?.()
  }
  render() {
    return this.state.failed ? <StaticFallback /> : this.props.children
  }
}
