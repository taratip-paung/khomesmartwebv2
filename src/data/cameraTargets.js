/**
 * Central camera configuration.
 * Every camera move in the app is a transition between two of these states.
 *   position  — camera world position
 *   target    — point the camera looks at (OrbitControls target)
 *   duration  — transition time in ms
 * Distances are in scene units (the house is ~3 units wide).
 */
export const cameraTargets = {
  default: {
    position: [18.5, 12.5, 20],
    target: [2.6, 1.8, -1.2],
    duration: 1200,
  },
  solar: {
    position: [6.5, 7.5, 9],
    target: [0.3, 2.6, 0],
    duration: 1000,
  },
  rnd: {
    position: [-10.5, 4.8, 9.5],
    target: [-5, 1.4, 3],
    duration: 1000,
  },
  network: {
    position: [15.5, 9, -11.5],
    target: [5, 3, -3],
    duration: 1000,
  },
  cloud: {
    position: [12, 5.8, 10.5],
    target: [5, 2, 3.5],
    duration: 1000,
  },
}

/** Portrait screens see less width — push the camera back by this factor */
export const portraitDistanceFactor = 1.45

export const cameraLimits = {
  minDistance: 5,
  maxDistance: 40,
  maxPolarAngle: Math.PI * 0.49, // never go below the floor
  minPolarAngle: Math.PI * 0.12,
}
