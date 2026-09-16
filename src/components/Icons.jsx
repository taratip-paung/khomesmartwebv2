/** Inline SVG icons — consistent across platforms (no emoji / special glyphs). */
const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export const icons = {
  sun: (
    <svg {...common}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  sensor: (
    <svg {...common}>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" />
    </svg>
  ),
  network: (
    <svg {...common}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v5M12 12l-5.5 5.5M12 12l5.5 5.5" />
    </svg>
  ),
  cloud: (
    <svg {...common}>
      <path d="M7 18a4 4 0 0 1-.6-7.95A6 6 0 0 1 18 9.5a3.5 3.5 0 0 1-.5 7H7z" />
    </svg>
  ),
  shield: (
    <svg {...common}>
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  layers: (
    <svg {...common}>
      <path d="M12 4l8 4-8 4-8-4 8-4z" />
      <path d="M4 12l8 4 8-4M4 16l8 4 8-4" />
    </svg>
  ),
  target: (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  ),
  check: (
    <svg {...common}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  chat: (
    <svg {...common}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5v-7z" />
    </svg>
  ),
  moon: (
    <svg {...common}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  ),
  reset: (
    <svg {...common}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  ),
  mail: (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </svg>
  ),
  facebook: (
    <svg {...common}>
      <path d="M14 8.5V7a1.5 1.5 0 0 1 1.5-1.5H17V3h-2.5A4 4 0 0 0 10.5 7v1.5H8V12h2.5v9h3.5v-9h2.6l.4-3.5H14z" />
    </svg>
  ),
  line: (
    <svg {...common}>
      <path d="M12 3.5c-4.97 0-9 3.27-9 7.3 0 3.6 3.2 6.6 7.5 7.2.3.06.7.2.8.45.1.23.06.6.03.83l-.13.8c-.04.24-.19.93.82.5 1-.42 5.4-3.2 7.4-5.5C20.6 13.7 21 12.3 21 10.8c0-4.03-4.03-7.3-9-7.3z" />
      <path d="M8 9v4M11 9v4l2.5 0M15.5 9v4M18 9h-2.5v4H18M15.5 11h2" />
    </svg>
  ),
  pin: (
    <svg {...common}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
}

export function Icon({ name, ...props }) {
  return (
    <span className="icon" {...props}>
      {icons[name]}
    </span>
  )
}

export { LogoMark } from './LogoMark'
