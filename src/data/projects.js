/**
 * Featured projects (section 04) — photo-first. Keep text to a title + one short meta line;
 * the photo does the talking.
 *
 * `service` links to a service id (src/data/services.js) → filter + accent colour.
 * `kind: 'software'` renders the card inside a browser frame (screenshots of platforms we build/host);
 *   those screenshots are demo-data versions (plates, vehicle photos and satellite imagery replaced) — never
 *   put a raw customer screenshot here.
 * `image` / `imageSm` live in public/projects/ (webp, 1080w and 700w) — generated from
 *   the originals in "Featured Projects/" (see project status doc for the resize script).
 *
 * Order = order shown under "All" — services are interleaved so the feed doesn't show one
 * category in a long run. Per-service filters keep this relative order.
 */
const shot = (id, service, title, meta, extra = {}) => ({
  id,
  service,
  title: typeof title === 'string' ? { th: title, en: title } : title,
  meta,
  image: `/projects/${id}.webp`,
  imageSm: `/projects/${id}-sm.webp`,
  ...extra,
})

export const projects = [
  // --- headline pieces ---
  shot('deye-25kw-thana-skypool', 'solar', 'Thana Skypool Villa',
    { th: 'โซลาร์รูฟท็อป 25 kW · 3 เฟส · Deye hybrid + แบตเตอรี่ Dyness 16 kWh', en: 'Solar rooftop 25 kW · 3-phase · Deye hybrid + Dyness 16 kWh battery' }),
  shot('landmos-type-c', 'rnd', 'LANDMOS Type C',
    { th: 'สถานีตรวจวัดดินถล่ม RTK-GNSS พลังงานแสงอาทิตย์ · กฟผ. เหมืองแม่เมาะ', en: 'Solar-powered RTK-GNSS landslide monitoring stations · EGAT Mae Moh mine' }),
  shot('cctv-wifi-hangdong', 'network', { th: 'บ้านพักอาศัย ย่านหางดง', en: 'Private Residence, Hang Dong' },
    { th: 'ออกแบบและติดตั้ง Access Point 8 ตัว + IP Camera 41 ตัว · Dahua / Cisco', en: 'Designed & installed 8 access points + 41 IP cameras · Dahua / Cisco' }),
  shot('grand-village-anpr-platform', 'cloud', 'The Grand Village — Secure Access',
    { th: 'แพลตฟอร์ม ANPR + ระบบรักษาความปลอดภัย · โฮสต์บน private cloud', en: 'ANPR & security platform · hosted on our private cloud' }, { kind: 'software' }),

  shot('the-y-smart-hotel', 'solar', 'The Y Smart Hotel',
    { th: 'โซลาร์รูฟท็อป 10 kW · 3 เฟส · เชียงใหม่', en: 'Solar rooftop 10 kW · 3-phase · Chiang Mai' }),
  shot('smart-village-lpr', 'rnd', { th: 'Smart Village — The Grand Village', en: 'Smart Village — The Grand Village' },
    { th: 'กล้องอ่านป้ายทะเบียน LPR + ไม้กั้นอัตโนมัติ · Hikvision · เชียงใหม่', en: 'LPR plate-reading cameras + automatic gate · Hikvision · Chiang Mai' }),
  shot('grand-village-ip-camera', 'network', { th: 'หมู่บ้าน The Grand Village', en: 'The Grand Village' },
    { th: 'IP Camera 32 ตัว · เครือข่ายทั้งหมู่บ้าน · เชียงใหม่', en: '32 IP cameras · village-wide network · Chiang Mai' }),
  shot('landmos-dashboard', 'cloud', 'RTK-LANDMOS Dashboard',
    { th: 'แดชบอร์ดเฝ้าระวังดินถล่ม RTK-GNSS · 3 ไซต์ · อัปเดตอัตโนมัติ', en: 'RTK-GNSS landslide monitoring dashboard · 3 sites · auto-updating' }, { kind: 'software' }),

  shot('huawei-20kw-cosmate', 'solar', { th: 'ร้านเครื่องสำอาง Cosmate · ลำพูน', en: 'Cosmate Cosmetics Store · Lamphun' },
    { th: 'โซลาร์รูฟท็อป 20 kW · 3 เฟส · Huawei', en: 'Solar rooftop 20 kW · 3-phase · Huawei' }),
  shot('landmos-type-d', 'rnd', 'LANDMOS Type D',
    { th: 'สถานีตรวจวัดดินถล่ม RTK-GNSS ชุดผลิตจำนวนมาก · กฟผ. เหมืองแม่เมาะ', en: 'RTK-GNSS landslide monitoring — production batch · EGAT Mae Moh mine' }),
  shot('cctv-network-leasing', 'network', { th: 'สำนักงานลีสซิ่ง สาขาแม่ริม', en: 'Leasing Office, Mae Rim Branch' },
    { th: 'ระบบกล้องวงจรปิด + เครือข่ายสำนักงาน · Dahua · เชียงใหม่', en: 'CCTV + office network · Dahua · Chiang Mai' }),

  shot('smart-car-park-resort', 'solar', 'Smart Car Park Resort',
    { th: 'โซลาร์รูฟท็อป 42 kW · 3 เฟส', en: 'Solar rooftop 42 kW · 3-phase' }),
  shot('smart-home-doi-lo', 'rnd', { th: 'Smart Home · บ้านพักอาศัย อ.ดอยหล่อ', en: 'Smart Home · Residence, Doi Lo' },
    { th: 'กล้องวงจรปิด + เครือข่าย + สัญญาณกันขโมย รวมศูนย์บน Home Assistant · Aqara / Hikvision / Aruba', en: 'CCTV + network + intrusion alarm unified on Home Assistant · Aqara / Hikvision / Aruba' }),
  shot('cctv-system', 'network', { th: 'ระบบกล้องวงจรปิดหมู่บ้าน', en: 'Village CCTV System' },
    { th: 'IP Camera · ดูออนไลน์ 24 ชม. · เชียงใหม่', en: 'IP cameras · 24/7 remote viewing · Chiang Mai' }),

  shot('deye-11kw-chateau', 'solar', 'The Chateau Chiang Mai Residence',
    { th: 'โซลาร์รูฟท็อป 11 kW · 3 เฟส · Deye hybrid + แบตเตอรี่ Dyness 16 kWh', en: 'Solar rooftop 11 kW · 3-phase · Deye hybrid + Dyness 16 kWh battery' }),
  shot('landmos-batch-2', 'rnd', { th: 'LANDMOS ส่งมอบชุดที่ 2', en: 'LANDMOS — 2nd Batch Delivery' },
    { th: 'สถานีตรวจวัดการเคลื่อนตัวของมวลดินแบบเรียลไทม์ · กฟผ. เหมืองแม่เมาะ', en: 'Real-time ground-movement monitoring stations · EGAT Mae Moh mine' }),

  // --- more solar rooftop ---
  shot('huawei-10kw-battery-smartguard', 'solar', { th: 'โซลาร์ 10 kW + แบตเตอรี่ + SmartGuard', en: 'Solar 10 kW + Battery + SmartGuard' },
    { th: 'โครงสร้างติดตั้ง 10 kW · 3 เฟส · แผง N-type · Huawei', en: 'Ground-mount 10 kW · 3-phase · N-type panels · Huawei' }),
  shot('huawei-11kw-battery-smartguard', 'solar', { th: 'บ้านพักอาศัย · เชียงใหม่', en: 'Private Residence · Chiang Mai' },
    { th: 'โซลาร์รูฟท็อป 11 kW · 3 เฟส · Huawei + แบตเตอรี่ 14 kWh + SmartGuard', en: 'Solar rooftop 11 kW · 3-phase · Huawei + 14 kWh battery + SmartGuard' }),
  shot('huawei-6-25kw-battery-smartguard', 'solar', { th: 'บ้านพักอาศัย ย่านสันผีเสื้อ · เชียงใหม่', en: 'Private Residence, San Phi Suea · Chiang Mai' },
    { th: 'โซลาร์รูฟท็อป 6.25 kW · Huawei + แบตเตอรี่ Dyness 16 kWh + SmartGuard · ใช้ไฟกลางวันและกลางคืน', en: 'Solar rooftop 6.25 kW · Huawei + Dyness 16 kWh battery + SmartGuard · day & night self-use' }),
  shot('deye-10kw-farm-lampang', 'solar', { th: 'สวนพริกหวาน · ลำปาง', en: 'Bell Pepper Farm · Lampang' },
    { th: 'โซลาร์ 10 kW · 3 เฟส · Deye hybrid + แบตเตอรี่ Dyness 5 kWh', en: 'Solar 10 kW · 3-phase · Deye hybrid + Dyness 5 kWh battery' }),
  shot('hoymiles-11-5kw', 'solar', { th: 'โซลาร์รูฟท็อป Hoymiles micro-inverter', en: 'Hoymiles Micro-inverter Rooftop' },
    { th: '11.5 kW · micro-inverter รายแผง · Hoymiles', en: '11.5 kW · per-panel micro-inverters · Hoymiles' }),
  shot('huawei-11kw-khome', 'solar', { th: 'สำนักงาน K-Home Construction · เชียงใหม่', en: 'K-Home Construction Office · Chiang Mai' },
    { th: 'โซลาร์รูฟท็อป 11 kW · 3 เฟส · Huawei', en: 'Solar rooftop 11 kW · 3-phase · Huawei' }),
  shot('huawei-11kw-noodle-factory', 'solar', { th: 'โรงงานผลิตขนมจีน', en: 'Rice-noodle Factory' },
    { th: 'โซลาร์รูฟท็อป 11 kW · 3 เฟส · Huawei', en: 'Solar rooftop 11 kW · 3-phase · Huawei' }),
  shot('huawei-10kw-maerim', 'solar', { th: 'บ้านพักอาศัย อ.แม่ริม · เชียงใหม่', en: 'Private Residence, Mae Rim · Chiang Mai' },
    { th: 'โซลาร์รูฟท็อป 10 kW · Huawei + Optimizer รายแผง', en: 'Solar rooftop 10 kW · Huawei + per-panel optimizers' }),
  shot('energylib-6kw', 'solar', { th: 'บ้านพักอาศัย · เชียงใหม่', en: 'Private Residence · Chiang Mai' },
    { th: 'โซลาร์รูฟท็อป 6 kW · 1 เฟส · EnergyLIB', en: 'Solar rooftop 6 kW · single-phase · EnergyLIB' }),
  shot('huawei-ev-charger', 'solar', 'Huawei EV Charger',
    { th: 'ติดตั้งเครื่องชาร์จรถไฟฟ้า Huawei 7.4 kW พร้อมเดินสายและตู้ไฟ', en: 'Huawei 7.4 kW EV charger install, wiring & distribution board' }),
]
