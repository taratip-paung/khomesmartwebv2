/**
 * Solar Builder feature switches.
 * SOLAR_PUBLIC  — show the "Solar Builder" link on the home page (keep false until milestone M1 is signed off).
 *                 /solar itself is always reachable by URL and shows a "preview" badge while false.
 * showDraft()   — draft (unverified) catalog items are visible in dev, or with ?draft on the URL.
 */
export const SOLAR_PUBLIC = false

export const showDraft = () => {
  try {
    return import.meta.env.DEV || new URLSearchParams(window.location.search).has('draft')
  } catch {
    return false
  }
}
