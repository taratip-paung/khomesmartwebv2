import { useMemo, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { useSolarBee } from './SolarBee'
import { showDraft } from './config'
import { DEFAULTS, withDefaults } from '../lib/solar/assumptions'
import { annualYield, annualYieldFromSunshine, compass8, transpositionFactor } from '../lib/solar/production'
import { mainSegment, roofFromPitch, selectedSegment } from '../lib/solar/insights'
import { fromKwp, recommendFromBill } from '../lib/solar/sizing'
import { modulesFor } from '../lib/solar/battery'
import { validateSystem } from '../lib/solar/rules'
import { catalog, byId, visibleItems } from '../data/solar/catalog'
import { explain, explainTitle } from '../data/solar/explain'

const fmt = (n, d = 0) => (n == null ? '–' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }))
const ROOF_TILT = { flat: 10, gable: 20, hip: 20 }

function Seg({ value, options, onChange, label }) {
  return (
    <div className="sb-seg" role="radiogroup" aria-label={label}>
      {options.map(([v, txt]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>
          {txt}
        </button>
      ))}
    </div>
  )
}

function Field({ label, value, children }) {
  return (
    <label className="sb-field">
      <span className="sb-field__label">
        {label}
        {value != null && <b>{value}</b>}
      </span>
      {children}
    </label>
  )
}

/** one-line satellite status used by several steps */
export function SatStatus({ ins, S, seg, onSeg }) {
  if (!ins || ins.status === 'idle') return null
  const tpl = (t, p) => t.replace(/\{(\w+)\}/g, (_, k) => p[k] ?? '')
  if (ins.status === 'loading') return <p className="sb-msg sb-msg--info">{S.sat.loading}</p>
  if (ins.status === 'found') {
    const cur = selectedSegment(ins.data, seg)
    const best = mainSegment(ins.data)
    return (
      <div className="sb-msg sb-msg--ok sb-sat">
        <b>{tpl(S.sat.found, { n: ins.data.segments.length })}</b>
        {onSeg && ins.data.segments.length > 1 && <span>{S.sat.pick}</span>}
        <ul className="sb-faces" role="radiogroup" aria-label={S.sat.pick}>
          {ins.data.segments.map((s) => (
            <li key={s.i}>
              <button type="button" role="radio" aria-checked={cur?.i === s.i} disabled={!onSeg} onClick={() => onSeg?.(s.i)}>
                <b>{S.compass[compass8(s.azimuth)]} {Math.round(s.azimuth)}°</b>
                <span>{tpl(S.sat.face, { pitch: Math.round(s.pitch), area: Math.round(s.areaM2), sun: Math.round(s.sunshineMedian) })}</span>
                {best?.i === s.i && <em>{S.sat.best}</em>}
              </button>
            </li>
          ))}
        </ul>
        <small>{tpl(S.sat.quality, { q: ins.data.imageryQuality, d: ins.data.imageryDate ?? '–' })} · {S.sat.attribution}</small>
      </div>
    )
  }
  return <p className="sb-msg sb-msg--warning">{ins.status === 'not_found' ? S.sat.notFound : ins.status === 'limit' ? S.limit.short : S.sat.unavailable}</p>
}

/** satellite-derived orientation for a roof face (chosen index, or the suggested one) */
export function satOrientation(ins, seg) {
  const m = ins?.status === 'found' ? selectedSegment(ins.data, seg) : null
  if (!m) return null
  const roof = roofFromPitch(m.pitch)
  return { seg: m.i, azimuth: (Math.round(m.azimuth / 5) * 5) % 360, tilt: roof === 'flat' ? 10 : Math.min(40, Math.round(m.pitch)), roof }
}

/** choose a roof face → apply its orientation */
export const pickFace = (ins, set) => (i) => {
  const o = satOrientation(ins, i)
  if (o) set(o)
}

/* ---------------------------------------------------------------- 1 locate */
export function LocateStep({ state, set, S, ins }) {
  const [err, setErr] = useState(null)
  const gps = () => {
    setErr(null)
    if (!navigator.geolocation) return setErr(S.locate.gpsFail)
    navigator.geolocation.getCurrentPosition(
      (p) => set({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }),
      () => setErr(S.locate.gpsFail),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }
  return (
    <>
      <h2>{S.locate.h}</h2>
      <p className="sb-p">{S.locate.p}</p>
      <div className="sb-row">
        <button type="button" className="btn btn--glass btn--sm" onClick={gps}>{S.locate.gps}</button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => set({ lat: 18.7883, lng: 98.9853 })}>{S.locate.sample}</button>
      </div>
      <div className="sb-grid2">
        <Field label={S.locate.lat}>
          <input type="number" step="0.00001" value={state.lat ?? ''} onChange={(e) => set({ lat: e.target.value === '' ? null : +e.target.value })} />
        </Field>
        <Field label={S.locate.lng}>
          <input type="number" step="0.00001" value={state.lng ?? ''} onChange={(e) => set({ lng: e.target.value === '' ? null : +e.target.value })} />
        </Field>
      </div>
      {err && <p className="sb-msg sb-msg--warning">{err}</p>}
      <SatStatus ins={ins} S={S} seg={state.seg} onSeg={pickFace(ins, set)} />
    </>
  )
}

/* ---------------------------------------------------------------- 2 orient */
export function useOrientation(state) {
  const lat = state.lat ?? DEFAULTS.latitude
  const factor = useMemo(() => transpositionFactor({ latitude: lat, tilt: state.tilt, azimuth: state.azimuth }), [lat, state.tilt, state.azimuth])
  const best = useMemo(() => {
    let b = { az: 180, f: 0 }
    for (let az = 0; az < 360; az += 15) {
      const f = transpositionFactor({ latitude: lat, tilt: state.tilt, azimuth: az })
      if (f > b.f) b = { az, f }
    }
    return b
  }, [lat, state.tilt])
  return { lat, factor, best }
}

export function OrientStep({ state, set, S, ins }) {
  const { factor, best } = useOrientation(state)
  const dir = (az) => S.compass[compass8(az)]
  const sat = satOrientation(ins, state.seg)
  return (
    <>
      <h2>{S.orient.h}</h2>
      <p className="sb-p">{S.orient.p}</p>
      <SatStatus ins={ins} S={S} seg={state.seg} onSeg={pickFace(ins, set)} />
      {sat && (sat.azimuth !== state.azimuth || sat.tilt !== state.tilt) && (
        <button type="button" className="btn btn--glass btn--sm" onClick={() => set(sat)}>{S.sat.apply}</button>
      )}
      <Field label={S.orient.roof}>
        <Seg
          label={S.orient.roof}
          value={state.roof}
          options={Object.entries(S.orient.roofs)}
          onChange={(roof) => set({ roof, tilt: ROOF_TILT[roof] })}
        />
      </Field>
      <Field label={S.orient.azimuth} value={`${dir(state.azimuth)} · ${state.azimuth}°`}>
        <input type="range" min="0" max="355" step="5" value={state.azimuth} onChange={(e) => set({ azimuth: +e.target.value })} />
      </Field>
      <Field label={S.orient.tilt} value={`${state.tilt}°`}>
        <input type="range" min="0" max="40" step="1" value={state.tilt} onChange={(e) => set({ tilt: +e.target.value })} />
      </Field>
      <div className="sb-stats">
        <div><span>{S.orient.vsFlat}</span><b className={factor >= 1 ? 'is-good' : 'is-warn'}>{factor >= 1 ? '+' : ''}{fmt((factor - 1) * 100, 1)}%</b></div>
        <div><span>{S.orient.vsBest}</span><b className={factor / best.f > 0.97 ? 'is-good' : 'is-warn'}>{fmt((factor / best.f - 1) * 100, 1)}%</b></div>
        <div><span>{S.orient.best}</span><b>{dir(best.az)}</b></div>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- 3 preview */
export function PreviewStep({ state, S, ins }) {
  const { lat } = useOrientation(state)
  const main = ins?.status === 'found' ? selectedSegment(ins.data, state.seg) : null
  const y = useMemo(
    () => (main ? annualYieldFromSunshine({ kwp: 1, sunshineHoursPerYear: main.sunshineMedian }) : annualYield({ kwp: 1, tilt: state.tilt, azimuth: state.azimuth, latitude: lat })),
    [main, lat, state.tilt, state.azimuth],
  )
  const kwp = main ? Math.min(5, Math.max(1, Math.floor(ins.data.maxKwp))) : 5
  return (
    <>
      <h2>{S.previewStep.h}</h2>
      {main && (
        <div className="sb-stats">
          <div><span>{S.sat.maxKwp}</span><b>{fmt(ins.data.maxKwp, 1)} kWp</b><small>{ins.data.maxPanels} × {ins.data.panelW} W</small></div>
          <div><span>{S.sat.sunshine}</span><b>{fmt(main.sunshineMedian)}</b><small>{S.sat.hoursYr}</small></div>
        </div>
      )}
      <div className="sb-hero-num">
        <b>{fmt(y.kwhPerKwp)}</b> kWh <span>{S.previewStep.perKwp}</span>
      </div>
      <div className="sb-stats">
        <div><span>{S.previewStep.example.replace('{kwp}', kwp)}</span><b>{fmt(y.kwh * kwp)} kWh</b><small>{S.previewStep.perYear}</small></div>
        <div><span>&nbsp;</span><b>{fmt((y.kwh * kwp) / 12)} kWh</b><small>{S.previewStep.perMonth}</small></div>
      </div>
      <details className="sb-assume">
        <summary>{S.previewStep.assumptions}</summary>
        <ul>
          <li>GHI {fmt(DEFAULTS.ghiMonthly.reduce((a, b) => a + b) / 12, 2)} kWh/m²/day (draft)</li>
          <li>PR {DEFAULTS.performanceRatio}</li>
          <li>tilt {state.tilt}°, azimuth {state.azimuth}°, factor {fmt(y.factor, 3)}</li>
        </ul>
      </details>
      <p className="sb-note">{main ? S.sat.basedOn : S.previewStep.note}</p>
      {main && <p className="sb-attr">{S.sat.attribution}</p>}
    </>
  )
}

/* ---------------------------------------------------------------- 4 login (placeholder until S5) */
export function LoginStep({ set, next, S }) {
  return (
    <>
      <h2>{S.login.h}</h2>
      <p className="sb-p">{S.login.p}</p>
      <div className="sb-col">
        <button type="button" className="btn sb-line" disabled>{S.login.line}</button>
        <button type="button" className="btn btn--glass" disabled>{S.login.phone}</button>
      </div>
      <p className="sb-note">{S.login.soon}</p>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => {
          set({ signedIn: true })
          window.setTimeout(next, 0)
        }}
      >
        {S.login.skip}
      </button>
    </>
  )
}

/* ---------------------------------------------------------------- 5 role */
export function RoleStep({ state, set, next, S }) {
  const pick = (role) => {
    set({ role })
    window.setTimeout(next, 0)
  }
  return (
    <>
      <h2>{S.role.h}</h2>
      <div className="sb-roles">
        {['learner', 'tech'].map((r) => (
          <button key={r} type="button" className="sb-role" aria-pressed={state.role === r} onClick={() => pick(r)}>
            <b>{S.role[r]}</b>
            <span>{S.role[`${r}P`]}</span>
          </button>
        ))}
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- 6 build */
function useCatalog() {
  const draft = showDraft()
  return useMemo(
    () => ({
      draft,
      inverters: visibleItems(catalog.inverters, { includeDraft: draft }),
      panels: visibleItems(catalog.panels, { includeDraft: draft }),
      batteries: visibleItems(catalog.batteries, { includeDraft: draft }),
    }),
    [draft],
  )
}

function IssueList({ issues, level, lang, onPick }) {
  if (!issues.length) return null
  const order = { error: 0, warning: 1, info: 2 }
  return (
    <ul className="sb-issues">
      {[...issues].sort((a, b) => order[a.level] - order[b.level]).map((x, i) => (
        <li key={i} className={`sb-msg sb-msg--${x.level}`}>
          <button type="button" onClick={() => onPick?.(explain(x.key, 'basic', lang, x.params))}>
            <b>{explainTitle(x.key, lang)}</b>
            <span>{explain(x.key, level, lang, x.params)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Parts({ sys, result, S, lang, onPick }) {
  const inv = byId[sys.inverterId]
  const pan = byId[sys.panelId]
  const bat = sys.batteryId ? byId[sys.batteryId] : null
  return (
    <ul className="sb-parts">
      <li><i className="dot dot--pv" />{sys.panels} × {pan.model}</li>
      <li><i className="dot dot--inv" />{inv.brand.toUpperCase()} {inv.model}</li>
      {bat && <li><i className="dot dot--bat" />{bat.model} × {sys.batteryModules}</li>}
      {result.autoAdds.map((a, i) => (
        <li key={i} className="is-auto">
          <button type="button" onClick={() => onPick(explain(a.reason, 'basic', lang))}>
            <i className={`dot dot--${a.kind}`} />
            {a.id ? byId[a.id]?.model : explainTitle('safety_kit', lang)}
            <em>{a.kind === 'safety' ? S.build.locked : S.build.added}</em>
          </button>
        </li>
      ))}
    </ul>
  )
}

function pickInverter(list, phase, kw, needBattery) {
  const ok = list.filter((x) => x.phase === phase && (!needBattery || x.batteryFamilies?.length)).sort((a, b) => a.acW - b.acW)
  return ok.find((x) => x.acW / 1000 >= kw * 0.9) ?? ok.at(-1)
}

function LearnerBuild({ state, set, S, lang, cat, say }) {
  const rec = useMemo(() => recommendFromBill({ billThb: state.bill, dayShare: state.dayShare }), [state.bill, state.dayShare])
  const [preset, setPreset] = useState('balanced')
  const panel = cat.panels[0]
  const systems = useMemo(() => {
    const out = {}
    for (const p of ['saver', 'balanced', 'backup']) {
      const inv = pickInverter(cat.inverters, state.phase, rec.inverterKw, p !== 'saver')
      if (!inv || !panel) continue
      const bat = p === 'saver' ? null : cat.batteries.find((b) => inv.batteryFamilies.includes(b.family))
      const sys = {
        phase: state.phase,
        backupMode: p === 'backup' ? 'part' : 'none',
        panelId: panel.id,
        panels: fromKwp(rec.kwpNeeded, { panelWp: panel.wp }).panels,
        inverterId: inv.id,
        batteryId: bat?.id ?? null,
        batteryModules: bat ? modulesFor(bat, rec.batteryKwhSuggested || bat.moduleKwh) : 0,
      }
      out[p] = { sys, result: validateSystem(sys, { byId }) }
    }
    return out
  }, [cat, panel, rec, state.phase])
  const cur = systems[preset]

  return (
    <>
      <Field label={S.build.bill} value={`${fmt(state.bill)} ฿`}>
        <input type="range" min="500" max="20000" step="100" value={state.bill} onChange={(e) => set({ bill: +e.target.value })} />
      </Field>
      <Field label={S.build.day} value={`${Math.round(state.dayShare * 100)}%`}>
        <input type="range" min="0.3" max="0.9" step="0.05" value={state.dayShare} onChange={(e) => set({ dayShare: +e.target.value })} />
      </Field>
      <Field label={S.build.phase}>
        <Seg label={S.build.phase} value={state.phase} options={[[1, S.build.phases[1]], [3, S.build.phases[3]]]} onChange={(phase) => set({ phase })} />
      </Field>
      <div className="sb-rec">
        <span>{S.build.rec}</span>
        <b>{fmt(rec.kwpNeeded, 1)} kWp</b>
        <small>≈ {fmt(rec.kwhDay)} kWh/day · {panel ? fromKwp(rec.kwpNeeded, { panelWp: panel.wp }).panels : rec.panels} × {panel?.wp ?? 620} W · 🔋 {rec.batteryKwhSuggested} kWh</small>
      </div>
      <div className="sb-presets" role="radiogroup">
        {['saver', 'balanced', 'backup'].map((p) => (
          <button key={p} type="button" role="radio" aria-checked={preset === p} onClick={() => setPreset(p)} disabled={!systems[p]}>
            <b>{S.build.presets[p]}</b>
            <span>{S.build.presetsP[p]}</span>
          </button>
        ))}
      </div>
      {cur && (
        <>
          <Parts sys={cur.sys} result={cur.result} S={S} lang={lang} onPick={say} />
          <IssueList issues={cur.result.issues.filter((x) => x.level !== 'info' || x.key.startsWith('battery') || x.key.startsWith('backup'))} level="basic" lang={lang} onPick={say} />
        </>
      )}
    </>
  )
}

function TechBuild({ state, set, S, lang, cat, say }) {
  const invs = cat.inverters.filter((x) => x.phase === state.phase)
  const [invId, setInvId] = useState(invs[0]?.id)
  const [panelId, setPanelId] = useState(cat.panels[0]?.id)
  const [panels, setPanels] = useState(8)
  const [batId, setBatId] = useState('')
  const [mods, setMods] = useState(2)
  const [tMin, setTMin] = useState(DEFAULTS.tMinC)
  const [acLen, setAcLen] = useState(10)
  const [dcLen, setDcLen] = useState(20)
  const inv = byId[invId] && byId[invId].phase === state.phase ? byId[invId] : invs[0]
  const bats = cat.batteries

  const sys = inv && {
    phase: state.phase,
    backupMode: state.backup,
    panelId,
    panels,
    inverterId: inv.id,
    batteryId: batId || null,
    batteryModules: mods,
    acLengthM: acLen,
    dcLengthM: dcLen,
  }
  const r = useMemo(() => (sys ? validateSystem(sys, { byId }, withDefaults({ tMinC: tMin })) : null), [JSON.stringify(sys), tMin]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!inv) return <p className="sb-note">{S.noCatalog}</p>
  return (
    <>
      <div className="sb-grid2">
        <Field label={S.build.phase}>
          <Seg label={S.build.phase} value={state.phase} options={[[1, S.build.phases[1]], [3, S.build.phases[3]]]} onChange={(phase) => set({ phase })} />
        </Field>
        <Field label={S.build.backup}>
          <select value={state.backup} onChange={(e) => set({ backup: e.target.value })}>
            {Object.entries(S.build.backups).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label={S.build.inverter}>
          <select value={inv.id} onChange={(e) => setInvId(e.target.value)}>
            {invs.map((x) => <option key={x.id} value={x.id}>{x.brand.toUpperCase()} {x.model}</option>)}
          </select>
        </Field>
        <Field label={S.build.panel}>
          <select value={panelId} onChange={(e) => setPanelId(e.target.value)}>
            {cat.panels.map((x) => <option key={x.id} value={x.id}>{x.model}</option>)}
          </select>
        </Field>
        <Field label={S.build.panels}>
          <input type="number" min="1" max="80" value={panels} onChange={(e) => setPanels(Math.max(1, +e.target.value || 1))} />
        </Field>
        <Field label="Tmin (°C)">
          <input type="number" min="-10" max="25" value={tMin} onChange={(e) => setTMin(+e.target.value)} />
        </Field>
        <Field label={S.build.battery}>
          <select value={batId} onChange={(e) => setBatId(e.target.value)}>
            <option value="">{S.build.none}</option>
            {bats.map((x) => <option key={x.id} value={x.id}>{x.model}{inv.batteryFamilies.includes(x.family) ? '' : ' ✕'}</option>)}
          </select>
        </Field>
        <Field label={S.build.modules}>
          <input type="number" min="1" max="12" value={mods} disabled={!batId} onChange={(e) => setMods(Math.max(1, +e.target.value || 1))} />
        </Field>
        <Field label="AC (m)">
          <input type="number" min="1" max="200" value={acLen} onChange={(e) => setAcLen(+e.target.value || 1)} />
        </Field>
        <Field label="DC (m)">
          <input type="number" min="1" max="200" value={dcLen} onChange={(e) => setDcLen(+e.target.value || 1)} />
        </Field>
      </div>

      {r?.array && (
        <table className="sb-table">
          <caption>{S.build.strings}</caption>
          <thead>
            <tr><th>{S.build.mppt}</th><th>{S.build.series}</th><th>{S.build.parallel}</th><th>{S.build.vocCold}</th><th>{S.build.vmpHot}</th><th>{S.build.isc}</th></tr>
          </thead>
          <tbody>
            {r.array.perMppt.map((m, i) => (
              <tr key={i}>
                <td>{r.strings[i].mpptIndex + 1}</td>
                <td>{r.strings[i].series}</td>
                <td>{r.strings[i].parallel}</td>
                <td>{fmt(m.values.vocColdString, 1)} V</td>
                <td>{fmt(m.values.vmpHotString, 1)} V</td>
                <td>{fmt(m.values.iscTotal, 1)} A</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {r && (
        <div className="sb-stats sb-stats--4">
          <div><span>{S.build.dcac}</span><b>{r.array ? fmt(r.array.dcAcRatio, 2) : '–'}</b></div>
          <div><span>{S.build.acBreaker}</span><b>{r.ac.breaker.rating ?? '–'} A</b></div>
          <div><span>{S.build.acCable}</span><b>{r.ac.cable?.mm2 ?? '–'} mm²</b><small>ΔV {fmt(r.ac.voltageDropPct, 2)}%</small></div>
          <div><span>{S.build.spdDc}</span><b>{r.spd.dc.ucV ?? '–'} V</b><small>{r.spd.dc.type}</small></div>
        </div>
      )}
      {r && <Parts sys={sys} result={r} S={S} lang={lang} onPick={say} />}
      {r && (r.issues.length ? <IssueList issues={r.issues} level="tech" lang={lang} onPick={say} /> : <p className="sb-msg sb-msg--ok">{S.build.allGood}</p>)}
    </>
  )
}

export function BuildStep({ state, set, S }) {
  const { lang } = useLang()
  const { say } = useSolarBee()
  const cat = useCatalog()
  const empty = !cat.inverters.length || !cat.panels.length
  return (
    <>
      <h2>{S.steps.build}</h2>
      {cat.draft && <p className="sb-draft">{S.draftData}</p>}
      {empty ? (
        <p className="sb-note">{S.noCatalog}</p>
      ) : state.role === 'tech' ? (
        <TechBuild state={state} set={set} S={S} lang={lang} cat={cat} say={say} />
      ) : (
        <LearnerBuild state={state} set={set} S={S} lang={lang} cat={cat} say={say} />
      )}
      <p className="sb-note">{S.build.coming3d}</p>
    </>
  )
}

/* ---------------------------------------------------------------- 7–8 placeholders */
export function SimulateStep({ S }) {
  return (
    <>
      <h2>{S.simulate.h}</h2>
      <p className="sb-p">{S.simulate.p}</p>
    </>
  )
}
export function SummaryStep({ S }) {
  return (
    <>
      <h2>{S.summary.h}</h2>
      <p className="sb-p">{S.summary.p}</p>
    </>
  )
}
