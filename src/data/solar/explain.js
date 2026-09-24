/**
 * Human explanations for every engine issue / auto-add key (src/lib/solar/*).
 * `basic` = what น้องบี says to a learner, `tech` = the engineering reason for technicians.
 * {param} placeholders are filled by `explain()` — numbers are rounded for display.
 * ⚠ Owner reviews all technical wording before launch (plan S6.2).
 */
export const EXPLAIN = {
  // --- system level ----------------------------------------------------------
  phase_mismatch: {
    title: { th: 'เฟสไม่ตรงกับไฟบ้าน', en: 'Phase does not match the house' },
    basic: { th: 'บ้านใช้ไฟ {house} เฟส แต่ inverter ตัวนี้เป็นแบบ {inverter} เฟส ต่อด้วยกันไม่ได้ครับ', en: 'The house is {house}-phase but this inverter is {inverter}-phase — they cannot be connected.' },
    tech: { th: 'Inverter ต้องตรงกับระบบจ่ายไฟ ({house}φ) ของมิเตอร์การไฟฟ้า', en: 'Inverter must match the utility supply ({house}φ).' },
  },
  battery_incompatible: {
    title: { th: 'แบตเตอรี่ใช้กับ inverter นี้ไม่ได้', en: 'Battery not compatible' },
    basic: { th: 'Inverter ตัวนี้ใช้แบตแรงดัน{bus} แต่แบตที่เลือกเป็นแบบ{batteryBus} เหมือนปลั๊กคนละแบบครับ', en: 'This inverter needs a {bus} battery, the selected one is {batteryBus} — like a plug that does not fit.' },
    tech: { th: 'Battery bus ไม่ตรง ({bus} vs {batteryBus}) และไม่อยู่ในรายการ BMS ที่ผู้ผลิตรับรอง', en: 'Battery bus mismatch ({bus} vs {batteryBus}); not on the manufacturer compatibility list.' },
  },
  battery_too_few: { title: { th: 'แบตน้อยกว่าขั้นต่ำ', en: 'Below minimum battery modules' }, basic: { th: 'แบตรุ่นนี้ต้องมีอย่างน้อย {min} ก้อนครับ', en: 'This battery needs at least {min} modules.' }, tech: { th: 'จำนวนโมดูล {n} < ขั้นต่ำของ stack {min}', en: 'Modules {n} < stack minimum {min}.' } },
  battery_too_many: { title: { th: 'แบตเกินที่ต่อได้', en: 'Too many battery modules' }, basic: { th: 'ต่อแบตรุ่นนี้ได้มากสุด {max} ก้อนต่อชุดครับ', en: 'At most {max} modules per stack.' }, tech: { th: 'จำนวนโมดูล {n} > สูงสุดของ stack {max}', en: 'Modules {n} > stack maximum {max}.' } },
  battery_no_backup: {
    title: { th: 'มีแบต แต่ไฟดับจะไม่มีไฟใช้', en: 'Battery, but no power in an outage' },
    basic: { th: 'หลายคนเข้าใจผิดตรงนี้ครับ! มีแบตแล้วแต่ไม่มีอุปกรณ์สำรองไฟ พอไฟดับระบบจะหยุดทั้งหมดเพื่อความปลอดภัยของช่างการไฟฟ้า แบตจะใช้ได้แค่เก็บไฟไว้ใช้ตอนกลางคืน ลองกด "จำลองไฟดับ" ดูครับ', en: 'A common misunderstanding! Without a backup device the whole system shuts down in an outage (to protect line workers). The battery only shifts solar to the evening. Try "Simulate outage".' },
    tech: { th: 'Anti-islanding: ไม่มี backup path แยกจากกริด → inverter หยุดจ่ายเมื่อกริดหาย', en: 'Anti-islanding: without an isolated backup path the inverter ceases to energise when the grid is lost.' },
  },
  backup_builtin: {
    title: { th: 'Backup ในตัว', en: 'Built-in backup' },
    basic: { th: 'Inverter รุ่นนี้มีช่องจ่ายไฟสำรองในตัว ไม่ต้องซื้อกล่องเพิ่มครับ แต่ช่างต้องย้ายวงจรที่อยากให้มีไฟตอนดับไปไว้ที่ตู้แยก', en: 'This inverter has a backup output built in — no extra box. The circuits you want during an outage are moved to a separate panel.' },
    tech: { th: 'ใช้ LOAD/EPS port: แยกตู้ backup load, ตรวจ switchover time และระบบ N-PE ตอนโหมด off-grid', en: 'LOAD/EPS port: separate backup board; check switchover time and N-PE arrangement in island mode.' },
  },
  backup_no_battery: { title: { th: 'สำรองไฟแต่ไม่มีแบต', en: 'Backup without battery' }, basic: { th: 'ถ้าไฟดับตอนกลางคืน จะไม่มีไฟใช้เพราะไม่มีแบตเก็บไว้ครับ', en: 'An outage at night means no power — nothing is stored.' }, tech: { th: 'PV-only backup ใช้ได้เฉพาะกลางวันและไม่เสถียรเมื่อเมฆผ่าน', en: 'PV-only backup works in daylight only and is unstable under passing clouds.' } },
  backup_overload: { title: { th: 'โหลดสำรองเกินกำลัง', en: 'Backup load too high' }, basic: { th: 'ตอนไฟดับจะเปิดของได้ไม่เกิน {limit} kW แต่บ้านนี้ต้องการ {load} kW ครับ ลองเลือกเฉพาะวงจรสำคัญ', en: 'In an outage the system can supply {limit} kW but the house needs {load} kW — choose essential circuits only.' }, tech: { th: 'Backup load {load} kW > พิกัด backup {limit} kW (ตรวจ surge ของมอเตอร์/แอร์ด้วย)', en: 'Backup load {load} kW > backup rating {limit} kW (also check motor/AC inrush).' } },
  backup_not_supported: { title: { th: 'รุ่นนี้สำรองไฟไม่ได้', en: 'No backup capability' }, basic: { th: 'Inverter รุ่นนี้ไม่รองรับการใช้ไฟตอนดับครับ', en: 'This inverter cannot supply power during an outage.' }, tech: { th: 'ไม่มี backup port / อุปกรณ์เสริมที่รองรับ', en: 'No backup port or supported accessory.' } },
  backup_accessory_required: {
    title: { th: 'เติมอุปกรณ์สำรองไฟให้แล้ว', en: 'Backup device added' },
    basic: { th: 'ผมเติมกล่องนี้ให้ครับ ตอนไฟดับมันจะตัดบ้านออกจากสายการไฟฟ้าก่อน แล้วค่อยจ่ายไฟจากแบต ช่างที่ซ่อมสายไฟข้างนอกจึงปลอดภัย', en: 'I added this box: in an outage it first disconnects the house from the grid, then powers it from the battery — so line workers stay safe.' },
    tech: { th: 'Inverter ไม่มี backup port → ต้องใช้อุปกรณ์ตัดแยก/สลับอัตโนมัติของผู้ผลิต (เช่น SmartGuard) ตรวจ N-PE bonding ตามคู่มือ', en: 'No native backup port → manufacturer grid-isolation/transfer device required (e.g. SmartGuard); follow N-PE bonding instructions.' },
  },
  meter_required: { title: { th: 'มิเตอร์วัดไฟ', en: 'Energy meter' }, basic: { th: 'มิเตอร์ตัวนี้บอก inverter ว่าบ้านใช้ไฟเท่าไหร่ จะได้ไม่ส่งไฟย้อนออกสายการไฟฟ้าครับ', en: 'This meter tells the inverter how much the house uses, so it does not push power back to the grid.' }, tech: { th: 'ใช้สำหรับ zero-export / self-consumption ติดที่จุดต่อกริด', en: 'For zero-export / self-consumption, installed at the grid connection point.' } },
  safety_kit: {
    title: { th: 'ชุดความปลอดภัย (ถอดไม่ได้)', en: 'Safety kit (cannot be removed)' },
    basic: { th: 'ชุดนี้ผมล็อกไว้ครับ มีตัวกันฟ้าผ่า ตัวตัดไฟ DC ตัวตัดไฟรั่ว และสายดิน ทุกบ้านต้องมี', en: 'Locked on purpose: surge protection, DC isolator, RCD and earthing — every home needs them.' },
    tech: { th: 'SPD DC/AC, DC isolator, AC breaker + RCBO, ระบบกราวด์ — rating คำนวณจาก Voc สูงสุดและกระแส AC', en: 'DC/AC SPD, DC isolator, AC breaker + RCBO, earthing — ratings derived from max Voc and AC current.' },
  },
  missing_part: { title: { th: 'ยังเลือกอุปกรณ์ไม่ครบ', en: 'Parts missing' }, basic: { th: 'ยังขาด inverter หรือแผงอยู่ครับ', en: 'An inverter or panel is still missing.' }, tech: { th: 'ต้องมี inverter + panel', en: 'Inverter and panel required.' } },

  // --- strings ---------------------------------------------------------------
  voc_over_max: {
    title: { th: 'แรงดันแผงเกินที่ inverter รับได้', en: 'String voltage above inverter maximum' },
    basic: { th: 'ตอนเช้าที่อากาศเย็น แผงจะให้ไฟแรงขึ้น แผงเรียงต่อกันมากไปจะเกิน {max} V ที่ inverter ทนได้ และทำให้เสียหายได้ครับ ลดเหลือไม่เกิน {maxSeries} แผงต่อแถว', en: 'On cold mornings panels give higher voltage. Too many in a row exceed the inverter\'s {max} V and can damage it — use at most {maxSeries} per string.' },
    tech: { th: 'Voc ที่ {t}°C = {voc} V > Vdc max {max} V (MPPT {mppt}) — สูงสุด {maxSeries} แผง/สตริง', en: 'Voc at {t}°C = {voc} V > Vdc max {max} V (MPPT {mppt}) — max {maxSeries} modules/string.' },
  },
  isc_over_max: {
    title: { th: 'กระแสเกินช่องรับของ inverter', en: 'Current above MPPT short-circuit rating' },
    basic: { th: 'ขนานแผงหลายแถวเข้าช่องเดียว กระแสจะเกินที่ inverter ออกแบบไว้ครับ ย้ายไปอีกช่องหนึ่ง', en: 'Too many strings on one input — the current exceeds what the inverter is rated for. Move one to the other input.' },
    tech: { th: 'Isc รวม {isc} A > Isc max {max} A (MPPT {mppt})', en: 'Total Isc {isc} A > Isc max {max} A (MPPT {mppt}).' },
  },
  vmp_below_mppt: { title: { th: 'แรงดันต่ำไปตอนร้อน', en: 'Voltage too low when hot' }, basic: { th: 'ตอนร้อนจัดแรงดันแผงจะลดลง ถ้าแผงต่อแถวน้อยไป inverter จะทำงานไม่เต็มที่ครับ ควรมีอย่างน้อย {minSeries} แผง', en: 'When hot, panel voltage drops. With too few panels per string the inverter under-performs — use at least {minSeries}.' }, tech: { th: 'Vmp ที่อุณหภูมิเซลล์สูงสุด = {vmp} V < MPPT min {min} V (MPPT {mppt})', en: 'Vmp at max cell temp = {vmp} V < MPPT min {min} V (MPPT {mppt}).' } },
  vmp_above_mppt: { title: { th: 'แรงดันสูงกว่าช่วงทำงาน', en: 'Above MPPT range' }, basic: { th: 'เช้าที่เย็นมาก inverter จะตามจุดผลิตไฟดีที่สุดไม่ได้ช่วงสั้นๆ ครับ', en: 'On very cold mornings the inverter briefly cannot track the best operating point.' }, tech: { th: 'Vmp ที่ Tmin = {vmp} V > MPPT max {max} V (MPPT {mppt}) — เสียผลผลิตเล็กน้อย', en: 'Vmp at Tmin = {vmp} V > MPPT max {max} V (MPPT {mppt}) — minor yield loss.' } },
  below_start_voltage: { title: { th: 'แรงดันไม่พอเริ่มทำงาน', en: 'Below start-up voltage' }, basic: { th: 'แผงน้อยไป inverter จะเริ่มทำงานช้าตอนเช้าครับ', en: 'Too few panels — the inverter starts late in the morning.' }, tech: { th: 'Voc(STC) {voc} V < start-up {start} V', en: 'Voc(STC) {voc} V < start-up {start} V.' } },
  imp_over_mppt: { title: { th: 'กระแสสูงกว่าที่ใช้ได้เต็ม', en: 'Current above MPPT operating limit' }, basic: { th: 'แผงรุ่นใหญ่ให้กระแสมากกว่าที่ช่องนี้ใช้ได้ ผลิตไฟได้ไม่เต็มแผงช่วงเที่ยงนิดหน่อยครับ (ไม่อันตราย)', en: 'These large panels give more current than this input can use — a small midday loss (not dangerous).' }, tech: { th: 'Imp {imp} A > Imax {max} A (MPPT {mppt}) — current clipping; ไม่เกิน Isc max', en: 'Imp {imp} A > Imax {max} A (MPPT {mppt}) — current clipping; within Isc max.' } },
  too_many_mppt: { title: { th: 'ใช้ช่องเกินที่มี', en: 'Too many inputs used' }, basic: { th: 'Inverter มีช่องรับแผงแค่ {max} ช่องครับ', en: 'The inverter has only {max} inputs.' }, tech: { th: 'ใช้ {used} MPPT > มี {max}', en: '{used} MPPTs used > {max} available.' } },
  no_valid_string_layout: { title: { th: 'จัดแถวแผงไม่ได้', en: 'No valid string layout' }, basic: { th: 'แผง {panels} แผงจัดเข้า inverter นี้ให้ปลอดภัยไม่ได้ครับ ลองเปลี่ยนจำนวนแผงหรือรุ่น inverter', en: '{panels} panels cannot be arranged safely on this inverter — change the count or the inverter.' }, tech: { th: 'ไม่มีการแบ่งสตริงที่ผ่านทั้ง Vdc max, ช่วง MPPT และ Isc', en: 'No string split satisfies Vdc max, MPPT window and Isc.' } },
  dcac_high: { title: { th: 'แผงมากกว่า inverter มาก', en: 'DC/AC ratio high' }, basic: { th: 'แผงเยอะกว่ากำลัง inverter ช่วงเที่ยงจะผลิตไฟได้ไม่หมดครับ', en: 'Much more panel than inverter — some midday energy will be clipped.' }, tech: { th: 'DC/AC = {ratio} (> เกณฑ์เตือน)', en: 'DC/AC = {ratio} (above warning threshold).' } },
  dcac_low: { title: { th: 'Inverter ใหญ่กว่าแผง', en: 'Inverter oversized' }, basic: { th: 'Inverter ใหญ่กว่าแผงมาก เผื่อเพิ่มแผงในอนาคตได้ครับ', en: 'The inverter is larger than the array — room to add panels later.' }, tech: { th: 'DC/AC = {ratio}', en: 'DC/AC = {ratio}.' } },

  // --- protection --------------------------------------------------------------
  vdrop_ac: { title: { th: 'สาย AC ยาว/เล็กไป', en: 'AC voltage drop high' }, basic: { th: 'สายยาวไปทำให้เสียไฟระหว่างทางครับ ควรใช้สายใหญ่ขึ้น', en: 'Long cable wastes energy — use a larger size.' }, tech: { th: 'Voltage drop AC {pct}% > {max}%', en: 'AC voltage drop {pct}% > {max}%.' } },
  vdrop_dc: { title: { th: 'สาย DC ยาว/เล็กไป', en: 'DC voltage drop high' }, basic: { th: 'สายจากแผงยาวไป เสียไฟระหว่างทางครับ', en: 'Panel cables are long — energy is lost on the way.' }, tech: { th: 'Voltage drop DC {pct}% > {max}% (MPPT {mppt})', en: 'DC voltage drop {pct}% > {max}% (MPPT {mppt}).' } },
  breaker_exceeds_cable: { title: { th: 'เบรกเกอร์ใหญ่กว่าสาย', en: 'Breaker larger than cable rating' }, basic: { th: 'เบรกเกอร์ใหญ่กว่าที่สายทนได้ ถ้าไฟเกิน สายจะร้อนก่อนเบรกเกอร์ตัด อันตรายครับ', en: 'The breaker is bigger than the cable can carry — the cable would overheat before it trips. Dangerous.' }, tech: { th: 'In {breaker} A > Iz {ampacity} A', en: 'In {breaker} A > Iz {ampacity} A.' } },
  no_breaker_size: { title: { th: 'ไม่มีเบรกเกอร์ขนาดที่ต้องการ', en: 'No breaker size' }, basic: { th: 'กระแสสูงเกินตารางมาตรฐานครับ', en: 'Current beyond the standard table.' }, tech: { th: 'ต้องการ ≥ {need} A', en: 'Need ≥ {need} A.' } },
  no_cable_size: { title: { th: 'ไม่มีขนาดสายที่พอ', en: 'No cable size' }, basic: { th: 'กระแสสูงเกินตารางสายครับ', en: 'Current beyond the cable table.' }, tech: { th: 'กระแสออกแบบ {current} A เกินตาราง', en: 'Design current {current} A exceeds table.' } },
  string_fuse_required: { title: { th: 'ต้องมีฟิวส์ต่อแถว', en: 'String fuses required' }, basic: { th: 'ขนานแผง {parallel} แถว ต้องมีฟิวส์แยกแต่ละแถวครับ', en: '{parallel} strings in parallel need a fuse on each string.' }, tech: { th: '≥ 3 สตริงขนาน: กระแสย้อนจากสตริงอื่นอาจเกิน reverse current rating ของแผง', en: '≥ 3 parallel strings: back-feed may exceed module reverse-current rating.' } },
}

const fmt = (v) => (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(v < 10 ? 2 : 1)) : String(v))

/** explain(key, 'basic'|'tech', lang, params) → string with {params} filled */
export function explain(key, level, lang, params = {}) {
  const e = EXPLAIN[key]
  if (!e) return key
  const txt = e[level]?.[lang] ?? e[level]?.en ?? ''
  return txt.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? fmt(params[k]) : `{${k}}`))
}

export const explainTitle = (key, lang) => EXPLAIN[key]?.title?.[lang] ?? key
