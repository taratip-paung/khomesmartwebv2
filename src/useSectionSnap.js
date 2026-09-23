import { useEffect } from 'react'

const IDS = ['services', 'about', 'projects', 'contact'] // 02 – 05
const RANGE = 0.4 // snap when the heading ahead is within 40 % of the viewport
const INTENT_MS = 1500

/**
 * Direction-aware section snap. When a user scroll comes to rest and the NEXT heading in the
 * direction of travel is close (≤ 40 % of the viewport away), glide onto it — landing exactly
 * where the header nav's scrollToSection() lands. Unlike CSS `scroll-snap-type: proximity`
 * it never pulls you BACK to the heading you just left, so long sections (Projects, Contact)
 * scroll freely. The full-height hero always hands off to 02 (down) or the top (up).
 * Skipped while typing in the contact form and for programmatic scrolls (nav clicks).
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
    const landing = (id) => {
      const el = document.getElementById(id)
      return el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerH() + 60) : null
    }

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
      const pts = IDS.map(landing).filter((v) => v !== null)
      if (!pts.length) return
      let target = null
      const hero = document.getElementById('home')
      const heroFits = hero && hero.offsetHeight <= vh + 2
      if (heroFits && y > 1 && y < pts[0] - 1) {
        target = dir > 0 ? pts[0] : 0 // hero ↔ 02
      } else {
        const ahead = [0, ...pts].filter((p) => (dir > 0 ? p > y + 1 : p < y - 1))
        const next = dir > 0 ? Math.min(...ahead) : Math.max(...ahead)
        if (ahead.length && Math.abs(next - y) <= vh * RANGE) target = next
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
