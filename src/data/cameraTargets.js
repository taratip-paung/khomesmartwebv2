/**
 * Central camera configuration.
 * Every camera move in the app is a transition between two of these states.
 *   position  — camera world position
 *   target    — point the camera looks at (OrbitControls target)
 *   duration  — transition time in ms
 * Distances are in scene units (the house is ~3 units wide).
 */
export const cameraTargets = {
  /** preview of the back side — open with ?cam=back */
  back: {
    position: [-6, 12, -24],
    target: [0.5, 1.0, 0],
    duration: 1000,
  },
  /** debug/preview framing of the house only — open with ?cam=showcase */
  showcase: {
    position: [3, 6.5, 17],
    target: [0.2, 1.8, 0],
    duration: 1000,
  },
  default: {
    position: [6, 14.5, 27],
    target: [1.6, 1.0, -0.5],
    duration: 1200,
  },
  solar: {
    position: [6.5, 10.5, 10],
    target: [0.2, 3.2, -0.4],
    duration: 1000,
  },
  rnd: {
    position: [-9.5, 5.2, 10.5],
    target: [-6, 1.5, 3],
    duration: 1000,
  },
  network: {
    position: [14.5, 10.5, 7.5],
    target: [5.5, 3.4, -4],
    duration: 1000,
  },
  cloud: {
    position: [9.8, 3.6, 10],
    target: [6, 1.1, 3.5],
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
