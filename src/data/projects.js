/**
 * Featured projects (section 04) — photo-first. Keep text to a title + one short meta line;
 * the photo does the talking.
 *
 * `service` links to a service id (src/data/services.js) → filter + accent colour.
 * `image` / `imageSm` live in public/projects/ (webp, 1080w and 700w) — generated from
 *   the originals in "Featured Projects/" (see project status doc for the resize script).
 */
export const projects = [
  {
    id: 'the-y-smart-hotel',
    service: 'solar',
    title: { th: 'The Y Smart Hotel', en: 'The Y Smart Hotel' },
    meta: { th: 'โซลาร์รูฟท็อป 10 kW · 3 เฟส · เชียงใหม่', en: 'Solar rooftop 10 kW · 3-phase · Chiang Mai' },
    image: '/projects/the-y-smart-hotel.webp',
    imageSm: '/projects/the-y-smart-hotel-sm.webp',
  },
  {
    id: 'smart-car-park-resort',
    service: 'solar',
    title: { th: 'Smart Car Park Resort', en: 'Smart Car Park Resort' },
    meta: { th: 'โซลาร์รูฟท็อป 42 kW · 3 เฟส', en: 'Solar rooftop 42 kW · 3-phase' },
    image: '/projects/smart-car-park-resort.webp',
    imageSm: '/projects/smart-car-park-resort-sm.webp',
  },
  {
    id: 'grand-village-ip-camera',
    service: 'network',
    title: { th: 'หมู่บ้าน The Grand Village', en: 'The Grand Village' },
    meta: { th: 'IP Camera 32 ตัว · เครือข่ายทั้งหมู่บ้าน · เชียงใหม่', en: '32 IP cameras · village-wide network · Chiang Mai' },
    image: '/projects/grand-village-ip-camera.webp',
    imageSm: '/projects/grand-village-ip-camera-sm.webp',
  },
  {
    id: 'cctv-system',
    service: 'network',
    title: { th: 'ระบบกล้องวงจรปิดหมู่บ้าน', en: 'Village CCTV System' },
    meta: { th: 'IP Camera · ดูออนไลน์ 24 ชม. · เชียงใหม่', en: 'IP cameras · 24/7 remote viewing · Chiang Mai' },
    image: '/projects/cctv-system.webp',
    imageSm: '/projects/cctv-system-sm.webp',
  },
  {
    id: 'landmos-type-c',
    service: 'rnd',
    title: { th: 'LANDMOS Type C', en: 'LANDMOS Type C' },
    meta: { th: 'สถานีตรวจวัดดินถล่ม RTK-GNSS พลังงานแสงอาทิตย์', en: 'Solar-powered RTK-GNSS landslide monitoring stations' },
    image: '/projects/landmos-type-c.webp',
    imageSm: '/projects/landmos-type-c-sm.webp',
  },
  {
    id: 'landmos-type-d',
    service: 'rnd',
    title: { th: 'LANDMOS Type D', en: 'LANDMOS Type D' },
    meta: { th: 'สถานีตรวจวัดดินถล่ม RTK-GNSS ชุดผลิตจำนวนมาก', en: 'RTK-GNSS landslide monitoring — production batch' },
    image: '/projects/landmos-type-d.webp',
    imageSm: '/projects/landmos-type-d-sm.webp',
  },
]
