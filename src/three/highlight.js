/**
 * Highlight store — lives outside React so per-frame material updates never
 * trigger re-renders. Scene.jsx drives `setSelected`; `tick()` lerps the
 * per-group intensity and pushes it into every registered material
 * (see materials.js) — colour is dimmed for unselected groups, emissive
 * light is boosted for the selected one.
 *
 * Intensity levels:  selected 1.6 · neutral 1.0 · dimmed 0.45
 */
export const GROUPS = ['house', 'solar', 'rnd', 'network', 'cloud', 'base']

const state = {
  selected: null,
  current: Object.fromEntries(GROUPS.map((g) => [g, 1])),
  target: Object.fromEntries(GROUPS.map((g) => [g, 1])),
}

/** group → Set<material>; materials carry userData.base {color, emissive, ei, opacity} */
const registry = new Map(GROUPS.map((g) => [g, new Set()]))

export function registerMaterial(group, material) {
  registry.get(group)?.add(material)
}

export function setSelected(id) {
  state.selected = id
  for (const g of GROUPS) {
    if (!id) state.target[g] = 1
    else if (g === id) state.target[g] = 1.6
    else if (g === 'base') state.target[g] = 0.75
    else state.target[g] = 0.45
  }
}

/** call once per frame from Scene */
export function tick(dt, instant = false) {
  const k = instant ? 1 : Math.min(1, dt * 4)
  for (const g of GROUPS) {
    const cur = (state.current[g] += (state.target[g] - state.current[g]) * k)
    const colorK = Math.min(1, Math.max(0.4, cur)) // never brighten albedo, only dim
    const emisK = cur // selected → glows harder
    for (const m of registry.get(g)) {
      const b = m.userData.base
      if (!b) continue
      if (b.color) m.color.copy(b.color).multiplyScalar(colorK)
      if (b.ei !== undefined) m.emissiveIntensity = b.ei * emisK
      if (b.opacity !== undefined) m.opacity = b.opacity * Math.min(1, cur + 0.2)
    }
  }
}

export const intensity = (group) => state.current[group] ?? 1
export const selectedGroup = () => state.selected
