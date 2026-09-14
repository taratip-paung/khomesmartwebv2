import { useEffect, useState } from 'react'
import { useApp } from '../AppContext'
import { useLang } from '../i18n/LangContext'
import { LogoMark } from './Icons'

const MIN_SHOW_MS = 1400

/**
 * Intentional loading sequence: logo → progress → fade out once the scene
 * has rendered its first frame (sceneReady) AND the minimum time has elapsed.
 */
export default function LoadingScreen() {
  const { ui } = useLang()
  const { sceneReady } = useApp()
  const [elapsed, setElapsed] = useState(false)
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const t = setTimeout(() => setElapsed(true), MIN_SHOW_MS)
    return () => clearTimeout(t)
  }, [])

  const done = elapsed && sceneReady

  useEffect(() => {
    if (done) {
      setProgress(100)
      return
    }
    const id = setInterval(() => setProgress((p) => Math.min(sceneReady ? 96 : 82, p + Math.random() * 9)), 140)
    return () => clearInterval(id)
  }, [done, sceneReady])

  return (
    <div className="loader" data-done={done} aria-hidden={done} role="status">
      <div className="loader__inner">
        <LogoMark className="loader__mark" />
        <h2>{ui.loading.title}</h2>
        <p>{ui.loading.sub}</p>
        <div className="loader__bar">
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
