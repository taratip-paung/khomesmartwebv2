import { useRef, useState } from 'react'
import { services } from '../data/services'
import { useLang } from '../i18n/LangContext'
import { useTheme } from '../ThemeContext'
import { icons } from './Icons'
import { checkContact, checkEmail, checkMessage, checkName, checkProject, validateContact } from '../lib/contactRules'

/**
 * Section 06 enquiry form → POST /api/contact (server/contact-server.mjs → Telegram).
 * Kept short on purpose: what kind of job, project name, who to call back.
 *
 * Validation: rules live in src/lib/contactRules.js (shared with the server).
 * Each field shows its own message (what is wrong AND what format passes);
 * a field is checked when the user leaves it, and re-checked live once it has an error.
 */
const CHECK = { project: checkProject, name: checkName, contact: checkContact, email: checkEmail, message: checkMessage }

export default function ContactForm() {
  const { t, ui, lang } = useLang()
  const { accent } = useTheme()
  const f = ui.sections.contact.form
  const [service, setService] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorKey, setErrorKey] = useState(null) // top-level: fix | rate | generic
  const [fieldErrors, setFieldErrors] = useState({}) // { project: 'project', contact: 'phone', … }
  const startedAt = useRef(Date.now())
  const formRef = useRef(null)

  const setFieldError = (name, key) =>
    setFieldErrors((prev) => {
      if ((prev[name] || null) === key) return prev
      const next = { ...prev }
      if (key) next[name] = key
      else delete next[name]
      return next
    })

  // check on blur; once a field has an error, re-check on every keystroke so the message clears as they fix it
  const onBlur = (e) => setFieldError(e.target.name, CHECK[e.target.name]?.(e.target.value) ?? null)
  const onInput = (e) => {
    if (fieldErrors[e.target.name]) setFieldError(e.target.name, CHECK[e.target.name]?.(e.target.value) ?? null)
  }
  const pickService = (id) => {
    setService(id)
    setFieldError('service', null)
  }

  const focusFirstInvalid = (errs) => {
    const order = ['service', 'project', 'name', 'contact', 'email', 'message']
    const first = order.find((k) => errs[k])
    if (!first) return
    const el = first === 'service' ? formRef.current?.querySelector('[role=radio]') : formRef.current?.elements[first]
    el?.focus()
    el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (status === 'sending') return
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    payload.service = service
    payload.startedAt = startedAt.current
    payload.lang = lang

    const errs = validateContact(payload)
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      setErrorKey('fix')
      setStatus('error')
      focusFirstInvalid(errs)
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
        setFieldErrors({})
        formRef.current?.reset()
        setService('')
      } else if (data.error === 'invalid' && data.fields && typeof data.fields === 'object') {
        // server disagreed with us (should not happen — same rules) → show its per-field verdict
        setFieldErrors(data.fields)
        setErrorKey('fix')
        setStatus('error')
        focusFirstInvalid(data.fields)
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

  /** field wrapper: label + input + per-field message (plain function, not a nested component — a nested component would remount on every keystroke) */
  const field = (name, label, optional, children) => {
    const err = fieldErrors[name]
    return (
      <label className={`cform__field${err ? ' is-invalid' : ''}`}>
        <span className="cform__label">
          {label} {optional && <em>{f.optional}</em>}
        </span>
        {children}
        {err && (
          <span className="cform__hint" id={`cform-err-${name}`} role="alert">
            {f.errors[err] || f.errGeneric}
          </span>
        )}
      </label>
    )
  }
  const a11y = (name) => ({
    'aria-invalid': fieldErrors[name] ? true : undefined,
    'aria-describedby': fieldErrors[name] ? `cform-err-${name}` : undefined,
    onBlur,
    onInput,
  })

  return (
    <form ref={formRef} className="cform liquid" onSubmit={submit} noValidate>
      <fieldset className={`cform__types${fieldErrors.service ? ' is-invalid' : ''}`}>
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
              onClick={() => pickService(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        {fieldErrors.service && (
          <span className="cform__hint" role="alert">
            {f.errors.service}
          </span>
        )}
      </fieldset>

      {field('project', f.project, false, <input name="project" type="text" required minLength={2} maxLength={120} placeholder={f.projectPh} autoComplete="off" {...a11y('project')} />)}

      <div className="cform__row">
        {field('name', f.name, false, <input name="name" type="text" required minLength={2} maxLength={80} autoComplete="name" {...a11y('name')} />)}
        {field('contact', f.contact, false, <input name="contact" type="text" required minLength={6} maxLength={80} placeholder={f.contactPh} autoComplete="tel" inputMode="tel" {...a11y('contact')} />)}
      </div>

      {field('email', f.email, true, <input name="email" type="email" maxLength={120} autoComplete="email" inputMode="email" {...a11y('email')} />)}

      {field('message', f.message, true, <textarea name="message" rows={3} maxLength={1000} placeholder={f.messagePh} {...a11y('message')} />)}

      {/* honeypot — hidden from humans, bots fill it */}
      <label className="cform__hp" aria-hidden="true">
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      {status === 'error' && (
        <p className="cform__error" role="alert">
          {errorKey === 'fix' ? f.errFix : errorKey === 'rate' ? f.errRate : f.errGeneric}
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
