/**
 * UI strings — all placeholder copy, replace with approved company copy later.
 * Service-specific text lives in src/data/services.js, not here.
 */
export const strings = {
  th: {
    nav: { home: 'หน้าแรก', services: 'บริการ', about: 'เกี่ยวกับเรา', projects: 'ผลงาน', contact: 'ติดต่อ' },
    cta: { getInTouch: 'ติดต่อเรา', explore: 'สำรวจโซลูชันของเรา', contact: 'ติดต่อเรา', learnMore: 'ดูรายละเอียด' },
    hero: {
      kicker: 'SMART SOLUTION',
      kicker2: 'FOR A BETTER TOMORROW',
      brand: 'Be Connected Network & Solution Co.,Ltd.',
      statement: 'เทคโนโลยีที่เชื่อมต่อทุกความต้องการ\nเพื่อบ้านและธุรกิจของคุณ',
      categories: ['SMART HOME', 'SMART BUSINESS', 'SMART INFRASTRUCTURE'],
    },
    panel: {
      title: 'OUR SERVICES',
      hint: 'เลือกบริการเพื่อสำรวจในโมเดล 3D',
      introTitle: 'ระบบนิเวศเทคโนโลยีเดียว',
      introBody: 'สี่บริการที่ทำงานร่วมกันเป็นระบบเดียว — พลังงาน อุปกรณ์ เครือข่าย และคลาวด์ คลิกที่บริการหรือจุดในโมเดลเพื่อดูรายละเอียด',
    },
    help: {
      title: 'การควบคุม 3D',
      drag: 'ลาก = หมุน',
      wheel: 'เลื่อน = ซูม',
      touchDrag: 'ลากนิ้ว = หมุน',
      pinch: 'บีบนิ้ว = ซูม',
      reset: 'รีเซ็ตมุมมอง',
      scroll: 'เลื่อนลง',
    },
    loading: { title: 'BE CONNECTED', sub: 'Initializing Smart Environment…' },
    fallback: {
      title: 'อุปกรณ์นี้ไม่รองรับการแสดงผล 3D',
      body: 'คุณยังสามารถเลือกดูบริการทั้งหมดได้ด้านล่าง',
    },
    sections: {
      services: { kicker: '02 — OUR SERVICES', title: 'บริการของเรา', body: 'ครบวงจรตั้งแต่พลังงาน อุปกรณ์ เครือข่าย ไปจนถึงคลาวด์' },
      why: {
        kicker: '03 — WHY BE CONNECTED',
        title: 'ทำไมต้อง Be Connected',
        items: [
          { title: 'ความปลอดภัยและความน่าเชื่อถือมาก่อน', body: 'ทุกระบบออกแบบโดยถือความปลอดภัยและความเสถียรเป็นเกณฑ์พื้นฐาน ไม่ใช่ตัวเลือกเสริม' },
          { title: 'ทีมเดียวครบทุกชั้นของระบบ', body: 'ตั้งแต่ฮาร์ดแวร์ เซ็นเซอร์ เครือข่าย ไปจนถึงซอฟต์แวร์และคลาวด์ — ไม่ต้องประสานหลายผู้รับเหมา' },
          { title: 'ออกแบบตามโจทย์จริง', body: 'ไม่ใช่โซลูชันสำเร็จรูป แต่ปรับให้เข้ากับพื้นที่ งบประมาณ และการใช้งานของคุณ' },
        ],
      },
      projects: { kicker: '04 — FEATURED PROJECTS', title: 'ผลงานที่ผ่านมา', body: 'พื้นที่สำหรับผลงานเด่น (เนื้อหาชั่วคราว)' },
      contact: {
        kicker: '06 — CONTACT',
        title: 'พร้อมเริ่มโปรเจกต์ของคุณแล้วหรือยัง?',
        body: 'คุยกับทีมของเราเพื่อประเมินหน้างานและออกแบบระบบที่เหมาะกับคุณ',
        email: 'contact@beconnected.co.th',
      },
    },
    footer: { rights: 'สงวนลิขสิทธิ์', tagline: 'Smart Solution for a Better Tomorrow' },
    lang: { switchTo: 'EN' },
  },
  en: {
    nav: { home: 'Home', services: 'Services', about: 'About Us', projects: 'Projects', contact: 'Contact' },
    cta: { getInTouch: 'Get in Touch', explore: 'Explore Our Solutions', contact: 'Contact Us', learnMore: 'Learn More' },
    hero: {
      kicker: 'SMART SOLUTION',
      kicker2: 'FOR A BETTER TOMORROW',
      brand: 'Be Connected Network & Solution Co.,Ltd.',
      statement: 'Technology that connects every need\nfor your home and your business.',
      categories: ['SMART HOME', 'SMART BUSINESS', 'SMART INFRASTRUCTURE'],
    },
    panel: {
      title: 'OUR SERVICES',
      hint: 'Select a service to explore it in 3D',
      introTitle: 'One technology ecosystem',
      introBody: 'Four services that work as one system — energy, devices, network and cloud. Click a service or a marker in the model to explore.',
    },
    help: {
      title: '3D CONTROLS',
      drag: 'Drag = rotate',
      wheel: 'Scroll = zoom',
      touchDrag: 'Drag = rotate',
      pinch: 'Pinch = zoom',
      reset: 'Reset view',
      scroll: 'Scroll',
    },
    loading: { title: 'BE CONNECTED', sub: 'Initializing Smart Environment…' },
    fallback: {
      title: 'This device cannot display the 3D scene',
      body: 'You can still browse all services below.',
    },
    sections: {
      services: { kicker: '02 — OUR SERVICES', title: 'Our Services', body: 'End-to-end: energy, devices, network and cloud.' },
      why: {
        kicker: '03 — WHY BE CONNECTED',
        title: 'Why Be Connected',
        items: [
          { title: 'Safety and reliability first', body: 'Every system is designed with safety and stability as baseline criteria, never as optional extras.' },
          { title: 'One team across the whole stack', body: 'From hardware, sensors and networks to software and cloud — no juggling multiple contractors.' },
          { title: 'Built around the real problem', body: 'Not an off-the-shelf package — sized to your site, your budget and how you actually operate.' },
        ],
      },
      projects: { kicker: '04 — FEATURED PROJECTS', title: 'Featured Projects', body: 'Reserved for project highlights (placeholder).' },
      contact: {
        kicker: '06 — CONTACT',
        title: 'Ready to start your project?',
        body: 'Talk to our team for a site assessment and a system designed for you.',
        email: 'contact@beconnected.co.th',
      },
    },
    footer: { rights: 'All rights reserved', tagline: 'Smart Solution for a Better Tomorrow' },
    lang: { switchTo: 'TH' },
  },
}
