import { useEffect } from 'react'

const IDS = ['home', 'services', 'about', 'projects', 'contact'] // hero, 02 – 05
const TALL = 1.15 // a section taller than 115 % of the viewport scrolls freely inside
const INTENT_MS = 1500

/**
 * Section paging (owner's spec, 2026-09-24):
 * - Sections that fit the screen (hero, 02, 03, 05) page with the smallest scroll: a nudge down
 *   goes to the next heading, a nudge up goes to the previous one.
 * - A tall section (04 Projects — ~3 screens) scrolls freely inside. Going DOWN, once its end
 *   passes the bottom of the screen it hands off to the next heading (05). Going UP, near its top
 *   it settles on its own heading; from that heading a nudge up goes to 03. Coming up from 05
 *   lands on the END of 04 (last row of projects), not its heading.
 * Landing spot = the header nav's scrollToSection() (top − header + 60). Only user scrolls
 * (wheel / touch / keys) trigger it; nav clicks and the contact form are left alone.
 */
export default function useSectionSnap(reducedMotion) {
  useEffect(() => {
    let intentAt = 0
    let touching = false
    let restY = window.scrollY // where the page last came to rest
    let snapping = false
    let t = 0
    const hasScrollEnd = 'onscrollend' in window

    const headerH = () =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72
    const decide = () => {
      const from = restY
      const y = window.scrollY
      restY = y
      if (snapping) {
        snapping = false
        return
      }
      if (touching || performance.now() - intentAt > INTENT_MS) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const dir = Math.sign(y - from)
      if (!dir) return
      const vh = window.innerHeight
      const H = headerH()
      const secs = IDS.map((id) => {
        const el = document.getElementById(id)
        if (!el) return null
        const top = el.getBoundingClientRect().top + window.scrollY
        const land = id === 'home' ? 0 : Math.max(0, top - H + 60)
        const bottom = top + el.offsetHeight
        return { id, land, end: Math.max(land, bottom - vh), tall: el.offsetHeight > vh * TALL }
      }).filter(Boolean)
      if (secs.length < 2) return
      // section the gesture started in
      let k = 0
      for (let n = 0; n < secs.length; n++) if (secs[n].land <= from + 2) k = n
      const cur = secs[k]
      const prev = secs[k - 1]
      const next = secs[k + 1]
      // where a section is entered from below: tall → its end, otherwise its heading
      const arriveUp = (sec) => (sec.tall ? sec.end : sec.land)
      let target = null
      if (dir > 0) {
        if (!cur.tall) target = next ? next.land : null
        else if (y > cur.end + 8) target = next ? next.land : null // scrolled past the end of 04
      } else {
        const atHead = Math.abs(from - cur.land) < 6
        if (atHead) target = prev ? arriveUp(prev) : 0
        else if (y < cur.land - 6) target = prev ? arriveUp(prev) : 0 // scrolled above the heading
        else if (!cur.tall || y < cur.land + vh * 0.35) target = cur.land
      }
      if (target === null || Math.abs(target - y) < 2) return
      snapping = true
      restY = target
      window.scrollTo({ top: target, behavior: reducedMotion ? 'auto' : 'smooth' })
      if (!hasScrollEnd) setTimeout(() => (snapping = false), 900)
    }

    const onScroll = () => {
      if (!hasScrollEnd) {
        clearTimeout(t)
        t = setTimeout(decide, 160)
      }
    }
    const intent = () => {
      intentAt = performance.now()
    }
    const onKey = (e) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) intent()
    }
    const onTouchStart = () => {
      touching = true
      intent()
    }
    const onTouchEnd = () => {
      touching = false
      intent()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    if (hasScrollEnd) window.addEventListener('scrollend', decide)
    window.addEventListener('wheel', intent, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scrollend', decide)
      window.removeEventListener('wheel', intent)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [reducedMotion])
}
