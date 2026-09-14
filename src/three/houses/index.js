import HouseA from './HouseA'
import HouseB from './HouseB'
import HouseC from './HouseC'
import HouseD from './HouseD'
import HouseE from './HouseE'

/** House variants for the smart-home centre piece. Pick with DEFAULT_HOUSE or `?house=b` in the URL. */
export const HOUSES = {
  a: { name: 'Cantilever Villa', Component: HouseA },
  b: { name: 'Glass Pavilion', Component: HouseB },
  c: { name: 'Mono-slope Timber', Component: HouseC },
  d: { name: 'Tropical Modern', Component: HouseD },
  e: { name: 'Reference Villa', Component: HouseE },
}

export const DEFAULT_HOUSE = 'e'

export function currentHouse() {
  try {
    const q = new URLSearchParams(window.location.search).get('house')
    if (q && HOUSES[q]) return q
  } catch {
    /* ignore */
  }
  return DEFAULT_HOUSE
}
