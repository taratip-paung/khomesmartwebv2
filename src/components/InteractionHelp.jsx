import { useApp } from '../AppContext'
import { useLang } from '../i18n/LangContext'
import { icons } from './Icons'

export default function InteractionHelp() {
  const { ui } = useLang()
  const { resetCamera, isMobile } = useApp()
  const h = ui.help
  return (
    <div className="help liquid">
      <span className="help__k desktop-only">{h.title}</span>
      <span className="sep desktop-only" />
      <span>{isMobile ? h.touchDrag : h.drag}</span>
      <span className="sep" />
      <span>{isMobile ? h.pinch : h.wheel}</span>
      <span className="sep" />
      <button onClick={resetCamera} aria-label={h.reset}>
        <span className="icon" style={{ width: 14, height: 14, display: 'inline-flex' }}>
          {icons.reset}
        </span>
        {h.reset}
      </button>
    </div>
  )
}

export function ScrollCue() {
  const { ui } = useLang()
  return (
    <a className="scroll-cue" href="#services" aria-label={ui.help.scroll}>
      <span>{ui.help.scroll}</span>
      <i />
    </a>
  )
}
