/**
 * Central service data — the ONLY place service content lives.
 * UI (panel, cards, markers, sections) and the 3D scene all read from here.
 * Text is bilingual: pick with t(service.title) / service.title[lang].
 *
 * `cameraTarget` maps to src/data/cameraTargets.js
 * `objectGroup`  is the 3D highlight group id (matches Blender group naming, e.g. SOLAR_*)
 * `markerPosition` is the world-space anchor for the floating 3D marker
 */
export const services = [
  {
    id: 'solar',
    number: '01',
    icon: 'sun',
    accent: '#ffc857',
    title: { th: 'Solar Cell', en: 'Solar Cell' },
    subtitle: { th: 'Solar Energy Solution', en: 'Solar Energy Solution' },
    tagline: { th: 'Rooftop Solar', en: 'Rooftop Solar' },
    description: {
      th: 'ติดตั้งระบบ Solar Cell บนหลังคาแบบครบวงจร เพื่อช่วยลดค่าไฟและเพิ่มประสิทธิภาพด้านพลังงาน',
      en: 'Complete rooftop solar installation — designed, installed and commissioned to cut energy costs and improve efficiency.',
    },
    cameraTarget: 'solar',
    objectGroup: 'solar',
    markerPosition: [0, 4.6, 0],
    href: '#services',
  },
  {
    id: 'rnd',
    number: '02',
    icon: 'sensor',
    accent: '#7cf5c2',
    title: { th: 'R&D & Sensor', en: 'R&D & Sensor' },
    subtitle: { th: 'Custom IoT Solutions', en: 'Custom IoT Solutions' },
    tagline: { th: 'Custom IoT', en: 'Custom IoT' },
    description: {
      th: 'พัฒนาอุปกรณ์ ระบบเซ็นเซอร์ และ IoT ให้เหมาะกับโจทย์เฉพาะของแต่ละธุรกิจ',
      en: 'Custom devices, sensor systems and IoT built around the specific problem each business needs solved.',
    },
    cameraTarget: 'rnd',
    objectGroup: 'rnd',
    markerPosition: [-5.2, 4.2, 3.2],
    href: '#services',
  },
  {
    id: 'network',
    number: '03',
    icon: 'network',
    accent: '#35d6ff',
    title: { th: 'Network', en: 'Network' },
    subtitle: { th: 'WiFi / LAN / Fiber / LPWAN', en: 'WiFi / LAN / Fiber / LPWAN' },
    tagline: { th: 'WiFi / LAN / Fiber / LPWAN', en: 'WiFi / LAN / Fiber / LPWAN' },
    description: {
      th: 'ออกแบบและติดตั้ง WiFi, LAN, Fiber Optic และ LPWAN ให้เหมาะกับพื้นที่และการใช้งาน',
      en: 'Design and installation of WiFi, LAN, Fiber Optic and LPWAN networks matched to the site and how it is used.',
    },
    cameraTarget: 'network',
    objectGroup: 'network',
    markerPosition: [4.4, 7.0, -3.4],
    href: '#services',
  },
  {
    id: 'cloud',
    number: '04',
    icon: 'cloud',
    accent: '#a78bfa',
    title: { th: 'Cloud VPS', en: 'Cloud VPS' },
    subtitle: { th: 'Secure & Scalable', en: 'Secure & Scalable' },
    tagline: { th: 'Secure & Scalable', en: 'Secure & Scalable' },
    description: {
      th: 'โครงสร้างพื้นฐาน Cloud VPS สำหรับระบบที่ต้องการความยืดหยุ่นและขยายได้',
      en: 'Cloud VPS infrastructure for systems that need to stay secure, flexible and ready to scale.',
    },
    cameraTarget: 'cloud',
    objectGroup: 'cloud',
    markerPosition: [5.4, 5.6, 3.6],
    href: '#services',
  },
]

export const serviceById = Object.fromEntries(services.map((s) => [s.id, s]))
