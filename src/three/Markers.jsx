import { Html } from '@react-three/drei'
import { useApp } from '../AppContext'
import { services } from '../data/services'
import { useLang } from '../i18n/LangContext'
import { icons } from '../components/Icons'

/**
 * Floating 3D markers anchored in world space. Clicking one performs exactly
 * the same action as clicking the service card (plan §11).
 */
export default function Markers() {
  const { selectedId, select } = useApp()
  const { t } = useLang()
  return (
    <>
      {services.map((s) => (
        <Html key={s.id} position={s.markerPosition} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <button
            className="marker"
            style={{ '--accent': s.accent }}
            data-active={selectedId === s.id}
            data-dim={selectedId && selectedId !== s.id}
            onClick={() => select(s.id)}
            aria-label={`${s.number} ${t(s.title)}`}
          >
            <span className="marker__dot">{icons[s.icon]}</span>
            <span>
              <b>
                {s.number} {t(s.title)}
              </b>
              <small>{t(s.tagline)}</small>
            </span>
          </button>
        </Html>
      ))}
    </>
  )
}
