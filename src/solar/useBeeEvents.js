import { useEffect, useRef } from 'react'
import { useSolarBee } from './SolarBee'
import { beeEvent } from '../data/solar/beeScript'

const northish = (az) => az >= 290 || az <= 70

/**
 * S3.6 — event lines: น้องบี interrupts the step script when something the user did is worth a comment.
 * Only on CHANGES made during the visit (never on first render / page reload).
 */
export default function useBeeEvents(state, ins, lang) {
  const { say } = useSolarBee()
  const prev = useRef(null)
  useEffect(() => {
    const p = prev.current
    prev.current = {
      roof: state.roof,
      north: northish(state.azimuth),
      status: ins.status,
      key: ins.forKey,
      af: state.autoFor,
    }
    if (!p) return
    const onMapSteps = state.step === 'locate' || state.step === 'orient' || state.step === 'preview'
    if (!onMapSteps) return
    if (ins.forKey === p.key && ins.status !== p.status) {
      if (ins.status === 'found') return say(beeEvent(lang, 'sat_found', { n: ins.data.segments.length }))
      if (ins.status === 'not_found') return say(beeEvent(lang, 'sat_not_found'))
    }
    if (state.autoFor !== p.af) return // satellite values were just applied automatically — not the user's doing
    if (state.roof !== p.roof) return say(beeEvent(lang, `roof_${state.roof}`))
    if (state.step === 'orient' && northish(state.azimuth) && !p.north) return say(beeEvent(lang, 'facing_north'))
  }, [state.roof, state.azimuth, state.step, state.autoFor, ins.status, ins.forKey, lang, say]) // eslint-disable-line react-hooks/exhaustive-deps
}
