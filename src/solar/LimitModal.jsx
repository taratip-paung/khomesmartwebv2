import { useEffect, useRef, useState } from 'react'

/**
 * Pop-up when the server's daily Solar API cap is reached (HTTP 429, reason 'daily_limit').
 * Shown once per page view; the step text keeps a short reminder afterwards.
 */
export default function LimitModal({ ins, S, lang }) {
  const [open, setOpen] = useState(false)
  const shown = useRef(false)
  const btn = useRef()

  useEffect(() => {
    if (ins.status === 'limit' && !shown.current) {
      shown.current = true
      setOpen(true)
    }
  }, [ins.status])

  useEffect(() => {
    if (!open) return undefined
    btn.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const n = ins.data?.limit ?? 300
  const time = ins.data?.resetsAt
    ? new Date(ins.data.resetsAt).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
    : '00:00'

  return (
    <div className="sb-modal" role="dialog" aria-modal="true" aria-labelledby="sb-limit-title" onClick={() => setOpen(false)}>
      <div className="sb-modal__card liquid" onClick={(e) => e.stopPropagation()}>
        <div className="sb-modal__icon" aria-hidden="true">🐝</div>
        <h2 id="sb-limit-title">{S.limit.title}</h2>
        <p>{S.limit.body.replace('{n}', n).replace('{time}', time)}</p>
        <p className="sb-note">{S.limit.meanwhile}</p>
        <button ref={btn} type="button" className="btn btn--primary" onClick={() => setOpen(false)}>
          {S.limit.ok}
        </button>
      </div>
    </div>
  )
}
