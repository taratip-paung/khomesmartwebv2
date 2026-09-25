/**
 * น้องบี's lines on /solar — event-driven (see src/solar/SolarBee.jsx).
 * steps.<step>[]  : lines cycled while that step is open (per role where it differs)
 * Issue explanations come from ./explain.js (basic level) — not duplicated here.
 * ⚠ Owner reviews technical wording (plan S6.2).
 */
export const BEE_SCRIPT = {
  th: {
    steps: {
      locate: [
        'สวัสดีครับ ผมน้องบี วันนี้เราจะมาดูกันว่าหลังคาบ้านคุณผลิตไฟได้แค่ไหน',
        'พิมพ์ที่อยู่ กดใช้ตำแหน่งปัจจุบัน หรือแตะบนหลังคาบ้านในแผนที่ได้เลยครับ',
        'ปักหมุดให้อยู่กลางหลังคานะครับ ผมจะดึงข้อมูลผืนหลังคาจากดาวเทียมมาให้',
      ],
      orient: [
        'กรอบสีขาวบนแผนที่คือบ้านของคุณครับ ส่วนสีน้ำเงินคือที่วางแผง ลูกศรสีเหลืองคือทิศที่แผงหันไป',
        'หมุนให้กรอบตรงกับหลังคาจริง และให้ลูกศรชี้ด้านที่จะวางแผงนะครับ',
        'ลองเลื่อนจำนวนแผงทางขวาดูครับ จะเห็นว่าต้องใช้พื้นที่หลังคากี่ตารางเมตร',
        'ที่เชียงใหม่ แผงที่หันใต้ได้แดดมากที่สุดทั้งปี หันตะวันออกหรือตะวันตกเสียไปไม่กี่เปอร์เซ็นต์ครับ',
      ],
      preview: [
        'นี่คือไฟที่หลังคาคุณผลิตได้โดยประมาณครับ ดูพระอาทิตย์ขึ้นจนตก เงาบ้านกับกราฟด้านล่างจะวิ่งไปพร้อมกัน',
        'ลองเลือกฤดูดูครับ หน้าร้อนผลิตได้มากที่สุดต่อวัน หน้าฝนเมฆเยอะผลิตน้อยลง',
        'หน้าหนาวพระอาทิตย์อ้อมไปทางใต้และอยู่ต่ำ แผงที่หันใต้จึงยังผลิตได้ดี แต่เงาจะยาวขึ้นครับ',
        'กราฟเป็นรูปภูเขา ผลิตมากสุดช่วงเที่ยง ถ้าแผงหันตะวันออก ยอดกราฟจะเลื่อนไปช่วงเช้า',
        'ติดแผงเพิ่มไม่ได้แปลว่าไฟเพิ่มเท่ากันนะครับ แผงหลังๆ ต้องไปอยู่ด้านที่แดดน้อยหรือโดนเงา ดูกราฟเส้นโค้งทางขวาได้เลย',
        '1 kWp คือแผงรุ่นใหญ่ราว 2 แผง ใช้พื้นที่หลังคาประมาณ 5–6 ตารางเมตร',
        'ตัวเลขนี้เป็นผลเบื้องต้นนะครับ ก่อนติดตั้งจริงทีมช่างจะไปสำรวจหน้างานทุกครั้ง ทั้งโครงหลังคา เงา และระบบไฟในบ้าน',
      ],
      login: ['เข้าสู่ระบบไว้ จะได้บันทึกบ้านของคุณ กลับมาดูต่อได้ครับ'],
      role: ['ถ้าอยากเข้าใจภาพรวม เลือก "ผู้สนใจทั่วไป" ถ้าเป็นช่าง เลือกอีกแบบ ผมจะให้รายละเอียดเชิงเทคนิคครับ'],
      build_learner: ['ลองเลือกเซ็ตดูครับ แล้วดูว่าแต่ละชิ้นทำหน้าที่อะไร', 'Inverter แปลงไฟ DC จากแผงเป็น AC ที่ใช้ในบ้าน เปรียบเหมือนหัวใจของระบบครับ', 'kW คือกำลังผลิตสูงสุด ส่วน kWh คือปริมาณไฟที่เก็บหรือใช้ได้ คนละเรื่องกันนะครับ'],
      build_tech: ['ตัวคำนวณตรวจ Voc ตอนอากาศเย็นสุดก่อนเสมอ เพราะเกินแล้ว inverter เสียได้', 'ทุกค่ากดดูสมมติฐานได้ ปรับอุณหภูมิต่ำสุดให้ตรงหน้างานด้วยนะครับ'],
      simulate: ['ส่วนนี้ผมกำลังเตรียมอยู่ครับ จะได้เห็นไฟไหลตลอดวันและตอนไฟดับ'],
      summary: ['ขอบคุณที่มาเรียนรู้ด้วยกันครับ'],
    },
  },
  en: {
    steps: {
      locate: [
        "Hi, I'm Bee! Let's see how much energy your roof can make.",
        'Type an address, use your current location, or tap your roof on the map.',
        "Put the pin in the middle of the roof — I'll fetch the roof faces from satellite data.",
      ],
      orient: [
        'The white outline on the map is your home, the blue area is where panels go and the yellow arrow is where they face.',
        'Turn it so the outline matches the real roof and the arrow points to the panel side.',
        'Slide the panel count on the right to see how many square metres of roof it takes.',
        'In Chiang Mai south-facing panels get the most sun all year; east or west lose only a few percent.',
      ],
      preview: [
        'Here is roughly what your roof can produce. Watch the sun rise and set — the shadows and the chart below move together.',
        'Try the seasons: the hot season gives the most per day, the rainy season less because of clouds.',
        'In the cool season the sun stays low in the south — south-facing panels still do well, but shadows get longer.',
        'The chart is a hill that peaks around noon; panels facing east move the peak into the morning.',
        'More panels doesn’t mean the same extra energy each — later panels land on less sunny or shaded spots. See the curve on the right.',
        '1 kWp is about two large panels — roughly 5–6 m² of roof.',
        'This is a first estimate. Before any installation our team always surveys the site — roof structure, shading and the home’s wiring.',
      ],
      login: ['Sign in to save your home and continue later.'],
      role: ['Want the big picture? Pick "Curious homeowner". Installers get the technical detail.'],
      build_learner: ['Try a preset and see what each part does.', 'The inverter turns DC from the panels into AC for the house — the heart of the system.', 'kW is maximum power; kWh is the amount of energy stored or used. Different things!'],
      build_tech: ['The engine checks cold-morning Voc first — exceeding it can destroy the inverter.', 'Every value shows its assumptions; set the site minimum temperature to match your location.'],
      simulate: ["I'm still preparing this part — you'll see energy flow through the day and during an outage."],
      summary: ['Thanks for learning with me!'],
    },
  },
}

/** one-off lines when the user changes something (src/solar/useBeeEvents.js) */
export const BEE_EVENTS = {
  th: {
    roof_flat: 'หลังคาแบนวางแผงบนขาตั้งเอียงได้ แต่ต้องเว้นระยะแถวไม่ให้แผงบังเงากันเองครับ',
    roof_gable: 'หลังคาจั่วมีสองด้าน ปกติวางแผงด้านที่หันไปทางใต้หรือใกล้ใต้ที่สุดครับ',
    roof_hip: 'หลังคาปั้นหยามีสี่ด้าน แต่ละด้านพื้นที่เล็กลง บางบ้านต้องวางแผงสองด้านครับ',
    facing_north: 'ทิศเหนือได้แดดน้อยที่สุดที่เชียงใหม่ ถ้าหลังคามีด้านอื่น ลองหมุนไปทางใต้ดูครับ',
    sat_found: 'เจอข้อมูลหลังคาจากดาวเทียม {n} ผืนครับ ผมตั้งทิศให้ตามผืนที่แดดดีที่สุดแล้ว เปลี่ยนเองได้นะครับ',
    sat_not_found: 'หลังคานี้ยังไม่มีข้อมูลดาวเทียมละเอียด ไม่เป็นไรครับ ใช้ค่าแดดเฉลี่ยแล้วตั้งทิศเองได้',
  },
  en: {
    roof_flat: 'On a flat roof panels sit on tilted racks — rows need spacing so they don’t shade each other.',
    roof_gable: 'A gable roof has two sides; panels usually go on the side facing south, or closest to it.',
    roof_hip: 'A hip roof has four smaller sides — some homes need panels on two of them.',
    facing_north: 'North gets the least sun in Chiang Mai. If the roof has another side, try turning towards south.',
    sat_found: "Found {n} roof faces in satellite data. I've set the facing to the sunniest one — you can change it.",
    sat_not_found: 'No detailed satellite data for this roof yet. No problem — we use average sunshine and you set the facing.',
  },
}

export function beeEvent(lang, key, params = {}) {
  const t = (BEE_EVENTS[lang] ?? BEE_EVENTS.en)[key] ?? ''
  return t.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '')
}

/** lines for the current step (+ role variant) */
export function beeLines(lang, step, role) {
  const s = BEE_SCRIPT[lang]?.steps ?? BEE_SCRIPT.en.steps
  return s[`${step}_${role}`] ?? s[step] ?? s[`${step}_learner`] ?? []
}
