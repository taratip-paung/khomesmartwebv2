import { useRef, useState } from 'react'
import { services } from '../data/services'
import { useLang } from '../i18n/LangContext'
import { useTheme } from '../ThemeContext'
import { icons } from './Icons'

/**
 * Section 06 enquiry form → POST /api/contact (server/contact-server.mjs → Telegram).
 * Kept short on purpose: what kind of job, project name, who to call back.
 */
export default function ContactForm() {
  const { t, ui, lang } = useLang()
  const { accent } = useTheme()
  const f = ui.sections.contact.form
  const [service, setService] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorKey, setErrorKey] = useState(null)
  const startedAt = useRef(Date.now())
  const formRef = useRef(null)

  const submit = async (e) => {
    e.preventDefault()
    if (status === 'sending') return
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    payload.service = service
    payload.startedAt = startedAt.current
    payload.lang = lang
    if (!service) {
      setErrorKey('service')
      setStatus('error')
      return
    }
    setStatus('sending')
    setErrorKey(null)
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await r.json().catch(() => ({}))
      if (r.ok && data.ok) {
        setStatus('sent')
        formRef.current?.reset()
        setService('')
      } else {
        setErrorKey(data.error === 'rate_limited' ? 'rate' : 'generic')
        setStatus('error')
      }
    } catch {
      setErrorKey('generic')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="cform cform--done liquid" role="status" aria-live="polite">
        <span className="cform__check" aria-hidden="true">
          {icons.check}
        </span>
        <h3>{f.doneTitle}</h3>
        <p>{f.doneBody}</p>
        <button type="button" className="tile__link" onClick={() => setStatus('idle')}>
          {f.another} <span className="arrow">→</span>
        </button>
      </div>
    )
  }

  const options = [...services.map((s) => ({ id: s.id, label: t(s.title), accent: accent(s) })), { id: 'other', label: f.other, accent: null }]

  return (
    <form ref={formRef} className="cform liquid" onSubmit={submit} noValidate>
      <fieldset className="cform__types">
        <legend className="cform__label">{f.type}</legend>
        <div className="cform__chips" role="radiogroup" aria-label={f.type}>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={service === o.id}
              className={`chip chip--btn${service === o.id ? ' is-active' : ''}`}
              style={o.accent ? { '--accent': o.accent } : undefined}
              onClick={() => setService(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="cform__field">
        <span className="cform__label">{f.project}</span>
        <input name="project" type="text" required minLength={2} maxLength={120} placeholder={f.projectPh} autoComplete="off" />
      </label>

      <div className="cform__row">
        <label className="cform__field">
          <span className="cform__label">{f.name}</span>
          <input name="name" type="text" required minLength={2} maxLength={80} autoComplete="name" />
        </label>
        <label className="cform__field">
          <span className="cform__label">{f.contact}</span>
          <input name="contact" type="text" required minLength={6} maxLength={80} placeholder={f.contactPh} autoComplete="tel" inputMode="tel" />
        </label>
      </div>

      <label className="cform__field">
        <span className="cform__label">
          {f.email} <em>{f.optional}</em>
        </span>
        <input name="email" type="email" maxLength={120} autoComplete="email" />
      </label>

      <label className="cform__field">
        <span className="cform__label">
          {f.message} <em>{f.optional}</em>
        </span>
        <textarea name="message" rows={3} maxLength={1000} placeholder={f.messagePh} />
      </label>

      {/* honeypot — hidden from humans, bots fill it */}
      <label className="cform__hp" aria-hidden="true">
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      {status === 'error' && (
        <p className="cform__error" role="alert">
          {errorKey === 'service' ? f.errService : errorKey === 'rate' ? f.errRate : f.errGeneric}
        </p>
      )}

      <div className="cform__actions">
        <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
          {status === 'sending' ? f.sending : f.send} <span className="arrow">→</span>
        </button>
        <span className="cform__note">{f.note}</span>
      </div>
    </form>
  )
}
