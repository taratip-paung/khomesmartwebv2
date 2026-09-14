/**
 * Highlight store — lives outside React so per-frame material updates never
 * trigger re-renders. Scene.jsx drives `setSelected`; every Holo mesh reads
 * `intensity(group)` in its own useFrame.
 *
 * Intensity levels:  selected 1.6 · neutral 1.0 · dimmed 0.4
 */
export const GROUPS = ['house', 'solar', 'rnd', 'network', 'cloud', 'base']

const state = {
  selected: null,
  current: Object.fromEntries(GROUPS.map((g) => [g, 1])),
  target: Object.fromEntries(GROUPS.map((g) => [g, 1])),
}

export function setSelected(id) {
  state.selected = id
  for (const g of GROUPS) {
    if (!id) state.target[g] = 1
    else if (g === id) state.target[g] = 1.6
    else if (g === 'base') state.target[g] = 0.7
    else state.target[g] = 0.4
  }
}

/** call once per frame from Scene */
export function tick(dt, instant = false) {
  const k = instant ? 1 : Math.min(1, dt * 4)
  for (const g of GROUPS) state.current[g] += (state.target[g] - state.current[g]) * k
}

export const intensity = (group) => state.current[group] ?? 1
export const selectedGroup = () => state.selected
