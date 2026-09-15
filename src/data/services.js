/**
 * Central service data — the ONLY place service content lives.
 * UI (panel, cards, markers, sections) and the 3D scene all read from here.
 * Text is bilingual: pick with t(service.title) / service.title[lang].
 *
 * Card anatomy (section 02): title → outcome (one line, customer's view) → tags (scannable chips).
 * `subtitle` is the short label used by the 3D panel/markers; `description` is the panel body.
 *
 * `cameraTarget` maps to src/data/cameraTargets.js
 * `accent` / `accentLight` are the UI accent colours for dark / light theme (3D uses `accent`)
 * `objectGroup`  is the 3D highlight group id (matches Blender group naming, e.g. SOLAR_*)
 * `markerPosition` is the world-space anchor for the floating 3D marker
 * `image` (optional) — photo for the section-02 card header, path under public/ (e.g. '/services/solar.jpg').
 *   Omit → accent-tinted gradient header with icon watermark. Aim for ~1200×600, subject on the right/centre,
 *   because a gradient fades the bottom-left into the card body where the icon sits.
 */
export const services = [
  {
    id: 'solar',
    number: '01',
    icon: 'sun',
    accent: '#ffc857',
    accentLight: '#c98f00',
    title: { th: 'Solar Rooftop', en: 'Solar Rooftop' },
    subtitle: { th: 'Solar EPC', en: 'Solar EPC' },
    tagline: { th: 'Rooftop Solar', en: 'Rooftop Solar' },
    outcome: {
      th: 'โซลาร์รูฟท็อปที่ออกแบบจากโหลดไฟจริง พร้อมระบบมอนิเตอร์ดูได้จากมือถือ',
      en: 'Rooftop solar engineered for your real load, with monitoring you can check from your phone.',
    },
    tags: ['Survey & Design', 'EPC', 'Monitoring', 'O&M'],
    description: {
      th: 'สำรวจ ออกแบบ ติดตั้ง และส่งมอบระบบโซลาร์บนหลังคาแบบครบวงจร ขนาดระบบคำนวณจากโหลดไฟจริงของคุณ พร้อมระบบมอนิเตอร์และดูแลหลังการติดตั้ง',
      en: 'Survey, design, installation and commissioning of rooftop solar, sized from your actual consumption — with monitoring and after-install care.',
    },
    image: null,
    cameraTarget: 'solar',
    objectGroup: 'solar',
    markerPosition: [0.2, 5.3, -0.4],
    href: '#services',
  },
  {
    id: 'rnd',
    number: '02',
    icon: 'sensor',
    accent: '#7cf5c2',
    accentLight: '#149c66',
    title: { th: 'IoT & R&D', en: 'IoT & R&D' },
    subtitle: { th: 'Custom IoT', en: 'Custom IoT' },
    tagline: { th: 'Custom IoT', en: 'Custom IoT' },
    outcome: {
      th: 'เซ็นเซอร์และเฟิร์มแวร์ที่ออกแบบให้ทำงานได้เป็นปีโดยไม่ต้องดูแล ไม่ใช่แค่ผ่านเดโม',
      en: 'Custom sensors and firmware built to run for years unattended — not just for the demo.',
    },
    tags: ['ESP32', 'LoRa / RFID', 'Custom PCB', 'Cloud Dashboard'],
    description: {
      th: 'พัฒนาอุปกรณ์ เซ็นเซอร์ และระบบ IoT เฉพาะโจทย์ของแต่ละธุรกิจ ตั้งแต่ฮาร์ดแวร์ เฟิร์มแวร์ ไปจนถึงแดชบอร์ดบนคลาวด์',
      en: 'Custom devices, sensor systems and IoT built around each business’s specific problem — from hardware and firmware to the cloud dashboard.',
    },
    image: null,
    cameraTarget: 'rnd',
    objectGroup: 'rnd',
    markerPosition: [-6, 4.3, 3],
    href: '#services',
  },
  {
    id: 'network',
    number: '03',
    icon: 'network',
    accent: '#35d6ff',
    accentLight: '#0a8fc4',
    title: { th: 'Network', en: 'Network' },
    subtitle: { th: 'Infrastructure', en: 'Infrastructure' },
    tagline: { th: 'Fiber / WiFi / LPWAN', en: 'Fiber / WiFi / LPWAN' },
    outcome: {
      th: 'เครือข่ายที่ปลอดภัย แบ่งโซนชัด และไม่ล่ม ตั้งแต่ไฟเบอร์ WiFi ถึง LPWAN',
      en: 'Secure, segmented networks that stay up — from fiber backbone to WiFi to LPWAN.',
    },
    tags: ['Fiber', 'WiFi 6', 'Firewall / VLAN', 'LoRaWAN'],
    description: {
      th: 'ออกแบบและติดตั้งเครือข่ายทั้งระบบ ไฟเบอร์ LAN WiFi ไฟร์วอลล์ และ LPWAN ให้เหมาะกับพื้นที่และการใช้งานจริง',
      en: 'Design and installation of the whole network layer — fiber, LAN, WiFi, firewall and LPWAN — matched to the site and how it is used.',
    },
    image: null,
    cameraTarget: 'network',
    objectGroup: 'network',
    markerPosition: [5.5, 8.0, -4],
    href: '#services',
  },
  {
    id: 'cloud',
    number: '04',
    icon: 'cloud',
    accent: '#a78bfa',
    accentLight: '#7250ea',
    title: { th: 'Cloud & Hosting', en: 'Cloud & Hosting' },
    subtitle: { th: 'Private Cloud / VPS', en: 'Private Cloud / VPS' },
    tagline: { th: 'Secure & Scalable', en: 'Secure & Scalable' },
    outcome: {
      th: 'คลาวด์ส่วนตัวและ VPS ที่ backup ถูกทดสอบจริง ไม่ใช่แค่ตั้งไว้',
      en: 'Private cloud and VPS with backups that are tested, not assumed.',
    },
    tags: ['Proxmox', 'Backup & DR', 'Monitoring', 'VPN'],
    description: {
      th: 'โครงสร้างพื้นฐานคลาวด์ส่วนตัวและ VPS สำหรับระบบที่ต้องการความปลอดภัย ความยืดหยุ่น และขยายได้ พร้อมสำรองข้อมูลและมอนิเตอร์',
      en: 'Private cloud and VPS infrastructure for systems that need to stay secure, flexible and ready to scale — with backup and monitoring built in.',
    },
    image: null,
    cameraTarget: 'cloud',
    objectGroup: 'cloud',
    markerPosition: [6, 3.0, 3.5],
    href: '#services',
  },
]

export const serviceById = Object.fromEntries(services.map((s) => [s.id, s]))
