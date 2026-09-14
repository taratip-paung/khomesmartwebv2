import { HOUSES, currentHouse } from './houses'

/**
 * SMART_HOUSE — centre piece of the ecosystem. The actual building is one of
 * the variants in ./houses (see houses/index.js to change the default).
 */
export default function SmartHouse() {
  const { Component } = HOUSES[currentHouse()]
  return <Component />
}
