/**
 * น้องบี's lines on /solar — event-driven (see src/solar/SolarBee.jsx).
 * steps.<step>[]  : lines cycled while that step is open (per role where it differs)
 * Issue explanations come from ./explain.js (basic level) — not duplicated here.
 * ⚠ Owner reviews technical wording (plan S6.2).
 */
export const BEE_SCRIPT = {
  th: {
    steps: {
      locate: ['สวัสดีครับ ผมน้องบี วันนี้เราจะมาดูกันว่าหลังคาบ้านคุณผลิตไฟได้แค่ไหน', 'บอกตำแหน่งบ้านก่อนนะครับ ผมจะไปดูว่าแดดตกตรงไหนบ้าง'],
      orient: ['ที่เชียงใหม่ พระอาทิตย์อ้อมไปทางใต้เกือบทั้งปี แผงที่หันใต้จึงได้แดดมากที่สุดครับ', 'หันตะวันออกหรือตะวันตกก็ยังดีนะครับ เสียไปไม่กี่เปอร์เซ็นต์', 'หลังคาแบนมักวางแผงบนขาตั้งเอียงนิดหน่อย ให้น้ำฝนชะฝุ่นออกได้'],
      preview: ['นี่คือไฟที่หลังคาคุณผลิตได้โดยประมาณครับ', '1 kWp คือแผงประมาณ 2 แผงรุ่นใหญ่ ใช้พื้นที่ราว 5 ตารางเมตร'],
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
      locate: ["Hi, I'm Bee! Let's see how much energy your roof can make.", "Tell me where the house is — I'll check where the sun lands."],
      orient: ['In Chiang Mai the sun passes to the south most of the year, so south-facing panels get the most light.', 'East or west still works well — only a few percent less.', 'Flat roofs usually get panels on slightly tilted racks so rain can wash the dust off.'],
      preview: ["Here is roughly what your roof can produce.", '1 kWp is about two large panels — roughly 5 m² of roof.'],
      login: ['Sign in to save your home and continue later.'],
      role: ['Want the big picture? Pick "Curious homeowner". Installers get the technical detail.'],
      build_learner: ['Try a preset and see what each part does.', 'The inverter turns DC from the panels into AC for the house — the heart of the system.', 'kW is maximum power; kWh is the amount of energy stored or used. Different things!'],
      build_tech: ['The engine checks cold-morning Voc first — exceeding it can destroy the inverter.', 'Every value shows its assumptions; set the site minimum temperature to match your location.'],
      simulate: ["I'm still preparing this part — you'll see energy flow through the day and during an outage."],
      summary: ['Thanks for learning with me!'],
    },
  },
}

/** lines for the current step (+ role variant) */
export function beeLines(lang, step, role) {
  const s = BEE_SCRIPT[lang]?.steps ?? BEE_SCRIPT.en.steps
  return s[`${step}_${role}`] ?? s[step] ?? s[`${step}_learner`] ?? []
}
