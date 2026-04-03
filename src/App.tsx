import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  HEATING, HOT_WATER, COOKING, DPE_COLORS, DPE_TIPS, DPE_ORDER,
  RENOVATION_COST_PER_CLASS, TRANSPORT_MODES, PROFILES,
  ELEC_SCORE_TIPS, FOSSIL_SCORE_TIPS,
} from './data'
import {
  computeAnnual, computeInvestment, roundTen,
  type Scenario, type AnnualResult,
} from './utils/compute'

/* ── Ecodex Logo ── */
function EcodexLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="52 27 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ecoGrad1" x1="57" y1="32" x2="127" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B7CFF" />
          <stop offset="100%" stopColor="#3B4AE0" />
        </linearGradient>
        <linearGradient id="ecoGrad2" x1="57" y1="50" x2="97" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9BA8FF" />
          <stop offset="100%" stopColor="#5B6BFF" />
        </linearGradient>
      </defs>
      <path d="M57.07 47.97V35.24c0-1.69 1.37-3.07 3.07-3.07h34.06c17.96 0 32.53 14.56 32.53 32.53v2.38 2.22c0 17.96-14.56 32.53-32.53 32.53H60.14c-1.69 0-3.07-1.37-3.07-3.07V85.72c0-1.69 1.37-3.07 3.07-3.07h31.45c8.73 0 15.8-7.08 15.8-15.8 0-8.73-7.08-15.8-15.8-15.8H60.14c-1.69 0-3.07-1.37-3.07-3.07z" fill="url(#ecoGrad1)" />
      <path d="M57.07 63.32c0-1.36 1.1-2.45 2.45-2.45h31c3.39 0 6.14 2.75 6.14 6.14s-2.75 6.14-6.14 6.14h-31c-1.36 0-2.45-1.1-2.45-2.45v-7.36z" fill="url(#ecoGrad2)" />
    </svg>
  )
}

/* ── UI Primitives ── */

const selectStyle: React.CSSProperties = {
  padding: '7px 24px 7px 8px', borderRadius: 7, border: '1px solid #d1d5db',
  background: '#fff', fontSize: 12, width: '100%', cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 4l3 3 3-3' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center',
}

interface SelectOption { value: string; label: string; cat?: string }

function Sel({ value, onChange, options, grouped }: {
  value: string; onChange: (v: string) => void; options: SelectOption[]; grouped?: boolean
}) {
  if (grouped) {
    const cats = [...new Set(options.map(o => o.cat))]
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
        {cats.map(c => (
          <optgroup key={c} label={c}>
            {options.filter(o => o.cat === c).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    )
  }
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function NI({ value, onChange, suffix, step = 1, w = 68, title }: {
  value: number; onChange: (v: number) => void; suffix?: string; step?: number; w?: number; title?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }} title={title}>
      <input type="number" value={value} step={step} min={0}
        onChange={e => onChange(Number(e.target.value))}
        style={{ padding: '6px 5px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, width: w, textAlign: 'right' }} />
      {suffix && <span style={{ fontSize: 10, color: '#6b7280' }}>{suffix}</span>}
    </div>
  )
}

function FL({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 1, display: 'block' }}>{children}</label>
}

function SL({ color, icon, label, style: s }: { color: string; icon: string; label: string; style?: React.CSSProperties }) {
  return <h4 style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.04em', ...s }}>{icon} {label}</h4>
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [h, setH] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {children}
      {h && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 4, background: '#1f2937', color: '#fff', padding: '6px 10px', borderRadius: 7, fontSize: 10, lineHeight: 1.4, width: 260, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', pointerEvents: 'none', textAlign: 'left' }}>
          {text}
        </div>
      )}
    </div>
  )
}

function DPEBtn({ d, active, onClick }: { d: string; active: boolean; onClick: () => void }) {
  return (
    <Tip text={DPE_TIPS[d]}>
      <button onClick={onClick} style={{
        width: 26, height: 26, borderRadius: 5,
        border: active ? '2px solid #1f2937' : '2px solid transparent',
        background: DPE_COLORS[d], color: '#fff', fontWeight: 800, fontSize: 10,
        cursor: 'pointer', transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.15s',
      }}>{d}</button>
    </Tip>
  )
}

/* ── Transport Row ── */
function TRow({ t, i, onChange, onRemove }: {
  t: Scenario['transports'][0]; i: number;
  onChange: (i: number, k: string, v: any) => void; onRemove: (i: number) => void
}) {
  const m = TRANSPORT_MODES.find(x => x.id === t.mode)
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 150px', minWidth: 135 }}>
        <Sel value={t.mode} onChange={v => onChange(i, 'mode', v)} grouped
          options={TRANSPORT_MODES.map(x => ({ value: x.id, label: x.label, cat: x.category }))} />
      </div>
      <NI value={t.km} onChange={v => onChange(i, 'km', v)} suffix="km/an" step={500} w={60} title="Distance annuelle" />
      {m?.perVehicle && (
        <Tip text="Nombre moyen d'occupants (1-4). Divise émissions et amortissement par personne.">
          <NI value={t.occ || 1} onChange={v => onChange(i, 'occ', Math.max(1, Math.min(4, v)))} suffix="👤" step={1} w={28} title="Covoiturage" />
        </Tip>
      )}
      <input type="text" value={t.label} onChange={e => onChange(i, 'label', e.target.value)}
        placeholder="Usage" style={{ padding: '5px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 10, width: 65 }} />
      <button onClick={() => onRemove(i)} style={{
        width: 20, height: 20, borderRadius: 4, border: 'none', background: '#fee2e2',
        color: '#dc2626', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>×</button>
    </div>
  )
}

/* ── Scenario Panel ── */
function ScP({ title, emoji, sc, setSc, accent, showWarn }: {
  title: string; emoji: string; sc: Scenario; setSc: (s: Scenario) => void; accent: string; showWarn: boolean
}) {
  const uT = (i: number, k: string, v: any) => {
    const ts = [...sc.transports]; ts[i] = { ...ts[i], [k]: v }; setSc({ ...sc, transports: ts })
  }
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 10px', border: `2px solid ${accent}22`, flex: 1, minWidth: 290 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingBottom: 7, borderBottom: `2px solid ${accent}22` }}>
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1f2937' }}>{title}</h3>
      </div>
      <SL color={accent} icon="🏠" label="Logement" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div><FL>Surface</FL><NI value={sc.area} onChange={v => setSc({ ...sc, area: v })} suffix="m²" step={5} w={58} /></div>
        <div><FL>DPE (survolez)</FL><div style={{ display: 'flex', gap: 2 }}>{Object.keys(DPE_COLORS).map(d => <DPEBtn key={d} d={d} active={sc.dpe === d} onClick={() => setSc({ ...sc, dpe: d })} />)}</div></div>
      </div>
      {showWarn && ['D', 'E', 'F', 'G'].includes(sc.dpe) && (
        <div style={{ marginTop: 4, padding: '4px 7px', borderRadius: 5, background: '#fef3c7', border: '1px solid #f59e0b', fontSize: 10, color: '#92400e', lineHeight: 1.3 }}>
          💡 DPE {sc.dpe} : il est recommandé d'améliorer l'isolation avant de changer d'équipement.
        </div>
      )}
      <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div><FL>Chauffage</FL><Sel value={sc.heating} onChange={v => setSc({ ...sc, heating: v })} options={HEATING.map(t => ({ value: t.id, label: t.label }))} /></div>
        <div><FL>ECS</FL><Sel value={sc.hotWater} onChange={v => setSc({ ...sc, hotWater: v })} options={HOT_WATER.map(t => ({ value: t.id, label: t.label }))} /></div>
        <div><FL>Cuisson</FL><Sel value={sc.cooking} onChange={v => setSc({ ...sc, cooking: v })} options={COOKING.map(t => ({ value: t.id, label: t.label }))} /></div>
      </div>
      <SL color={accent} icon="🚗" label="Mobilité (distances annuelles)" style={{ marginTop: 10 }} />
      {sc.transports.map((t, i) => (
        <TRow key={i} t={t} i={i} onChange={uT} onRemove={i2 => setSc({ ...sc, transports: sc.transports.filter((_, j) => j !== i2) })} />
      ))}
      <button onClick={() => setSc({ ...sc, transports: [...sc.transports, { mode: 'bike', km: 1000, label: '', occ: 1 }] })}
        style={{ marginTop: 4, padding: '3px 9px', borderRadius: 5, border: `1px dashed ${accent}66`, background: `${accent}08`, color: accent, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
        + Mode de transport
      </button>
    </div>
  )
}

/* ── Profile Selector ── */
function PSel({ onSelect, activeId }: { onSelect: (p: typeof PROFILES[0]) => void; activeId: string | null }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Profil type (pré-rempli, ajustable)</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {PROFILES.map(p => (
          <button key={p.id} onClick={() => onSelect(p)} style={{
            padding: '7px 10px', borderRadius: 9,
            border: activeId === p.id ? '2px solid #1f2937' : '2px solid #e5e7eb',
            background: activeId === p.id ? '#1f2937' : '#fff',
            color: activeId === p.id ? '#fff' : '#374151',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', minWidth: 120, flex: '1 1 120px',
          }}>
            <div style={{ fontSize: 14 }}>{p.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{p.label}</div>
            <div style={{ fontSize: 9, opacity: 0.7 }}>{p.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Bar & Badge ── */
function BarR({ value, max, color, label, suffix }: { value: number; max: number; color: string; label: string; suffix: string }) {
  return (
    <div style={{ marginBottom: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 1 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: '#1f2937' }}>{Math.round(value).toLocaleString('fr-FR')} {suffix}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

function Badge({ grade, color, label, sub, tip }: { grade: string; color: string; label: string; sub: string; tip: string }) {
  return (
    <Tip text={tip}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'help' }}>
        <div style={{ width: 34, height: 34, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: color, color: '#fff', fontWeight: 900, fontSize: 16, boxShadow: `0 2px 8px ${color}44` }}>{grade}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#1f2937' }}>{label}</div>
          <div style={{ fontSize: 9, color: '#6b7280' }}>{sub} <span style={{ opacity: 0.5 }}>ⓘ</span></div>
        </div>
      </div>
    </Tip>
  )
}

/* ── Results ── */
function Results({ cur, tgt }: { cur: AnnualResult; tgt: AnnualResult }) {
  const [mode, setMode] = useState<'co2' | 'eur'>('co2')
  const isCO2 = mode === 'co2'
  const mx = isCO2 ? Math.max(cur.totalCO2, tgt.totalCO2, 1) : Math.max(cur.totalCost, tgt.totalCost, 1)
  const red = cur.totalCO2 > 0 ? ((cur.totalCO2 - tgt.totalCO2) / cur.totalCO2 * 100) : 0
  const sv = cur.totalCost - tgt.totalCost
  const sfx = isCO2 ? 'kgCO₂' : '€'

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 10px', border: '2px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1f2937' }}>📊 Résultats</h3>
        <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', borderRadius: 6, padding: 2 }}>
          {[{ id: 'co2' as const, l: '🌍 CO₂' }, { id: 'eur' as const, l: '💰 Coûts' }].map(t => (
            <button key={t.id} onClick={() => setMode(t.id)} style={{
              padding: '4px 10px', borderRadius: 5, border: 'none',
              background: mode === t.id ? '#1f2937' : 'transparent',
              color: mode === t.id ? '#fff' : '#6b7280', fontWeight: 700, fontSize: 10, cursor: 'pointer',
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 8 }}>
        {([{ l: 'Actuel', r: cur, bg: '#fef2f2' }, { l: 'Cible', r: tgt, bg: '#f0fdf4' }] as const).map(({ l, r, bg }) => (
          <div key={l} style={{ padding: 8, borderRadius: 8, background: bg }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Badge grade={r.elecScore.g} color={r.elecScore.c} label={`Élec. ${Math.round(r.electricPct)}%`} sub={r.elecScore.t} tip={ELEC_SCORE_TIPS[r.elecScore.g]} />
              <Badge grade={r.fossilScore.g} color={r.fossilScore.c} label={`Fossiles ${Math.round(r.fossilPct)}%`} sub={`Exp. ${r.fossilScore.t.toLowerCase()}`} tip={FOSSIL_SCORE_TIPS[r.fossilScore.g]} />
            </div>
          </div>
        ))}
      </div>

      {/* Conditional banner */}
      {isCO2 ? (
        red > 0 ? (
          <div style={{ padding: 7, borderRadius: 7, background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>-{Math.round(red)}% d'émissions CO₂</div>
            <div style={{ fontSize: 10, opacity: 0.85 }}>soit {roundTen(cur.totalCO2 - tgt.totalCO2).toLocaleString('fr-FR')} kgCO₂eq/an évités</div>
          </div>
        ) : null
      ) : (
        <div style={{ padding: 7, borderRadius: 7, background: sv > 0 ? 'linear-gradient(135deg,#2563eb,#3b82f6)' : '#f3f4f6', color: sv > 0 ? '#fff' : '#374151', textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{sv > 0 ? '-' : '+'}{roundTen(Math.abs(sv)).toLocaleString('fr-FR')} €/an</div>
          <div style={{ fontSize: 10, opacity: 0.85 }}>coût complet : {roundTen(cur.totalCost).toLocaleString('fr-FR')} → {roundTen(tgt.totalCost).toLocaleString('fr-FR')} €</div>
        </div>
      )}

      {/* Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {([
          { l: 'Actuel', d: cur, cs: ['#ef4444', '#f97316', '#eab308', '#8b5cf6'] },
          { l: 'Cible', d: tgt, cs: ['#10b981', '#06b6d4', '#14b8a6', '#6366f1'] },
        ] as const).map(({ l, d, cs }) => {
          const total = isCO2 ? d.totalCO2 : d.totalCost
          return (
            <div key={l}>
              <div style={{ fontSize: 9, fontWeight: 700, color: cs[0], marginBottom: 3, textTransform: 'uppercase' }}>{l} — {roundTen(total).toLocaleString('fr-FR')} {sfx}/an</div>
              <BarR value={isCO2 ? d.heatingCO2 : d.heatingCost} max={mx} color={cs[0]} label="Chauffage" suffix={sfx} />
              <BarR value={isCO2 ? d.hwCO2 : d.hwCost} max={mx} color={cs[1]} label="ECS" suffix={sfx} />
              <BarR value={isCO2 ? d.cookCO2 : d.cookCost} max={mx} color={cs[2]} label="Cuisson" suffix={sfx} />
              {d.transportDetails.map((t, i) => (
                <BarR key={i} value={isCO2 ? t.co2 : t.cost} max={mx} color={cs[3]} label={`${t.modeName}${t.label ? ` (${t.label})` : ''}`} suffix={sfx} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Business Case ── */
function BizCase({ curSc, tgtSc, curR, tgtR }: { curSc: Scenario; tgtSc: Scenario; curR: AnnualResult; tgtR: AnnualResult }) {
  const [years, setYears] = useState(10)
  const [aidPct, setAidPct] = useState(40)
  const [fInfl, setFInfl] = useState(5)
  const [eInfl, setEInfl] = useState(2)
  const inv = useMemo(() => computeInvestment(curSc, tgtSc), [curSc, tgtSc])
  const aid = inv.totalInvestment * aidPct / 100
  const net = inv.totalInvestment - aid
  const cB = curR.totalCost, tB = tgtR.totalCost
  const cF = curR.fossilPct / 100, tF = tgtR.fossilPct / 100
  const cE = curR.electricPct / 100, tE = tgtR.electricPct / 100

  const data = useMemo(() => {
    let cc = 0, tc = net
    const pts = [{ year: 0, actuel: 0, cible: roundTen(net) }]
    for (let y = 1; y <= years; y++) {
      const fi = Math.pow(1 + fInfl / 100, y - 1)
      const ei = Math.pow(1 + eInfl / 100, y - 1)
      const oi = Math.pow(1.02, y - 1)
      cc += cB * (cF * fi + cE * ei + (1 - cF - cE) * oi)
      tc += tB * (tF * fi + tE * ei + (1 - tF - tE) * oi)
      pts.push({ year: y, actuel: roundTen(cc), cible: roundTen(tc) })
    }
    return pts
  }, [years, net, cB, tB, cF, tF, cE, tE, fInfl, eInfl])

  const bk = data.find(d => d.actuel >= d.cible && d.year > 0)
  const gain = (data[data.length - 1]?.actuel || 0) - (data[data.length - 1]?.cible || 0)
  const tdS: React.CSSProperties = { padding: '4px 6px', borderBottom: '1px solid #f3f4f6', fontSize: 10, color: '#374151' }
  const thS: React.CSSProperties = { padding: '4px 6px', borderBottom: '1px solid #e5e7eb', fontSize: 10, fontWeight: 600, color: '#1f2937', textAlign: 'left' }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 10px', border: '2px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800, color: '#1f2937' }}>💰 Business Case</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, padding: 8, borderRadius: 7, background: '#f9fafb' }}>
        <div><FL>Durée</FL><NI value={years} onChange={v => setYears(Math.max(3, Math.min(20, v)))} suffix="ans" step={1} w={40} /></div>
        <div><FL>Aides</FL><NI value={aidPct} onChange={v => setAidPct(Math.max(0, Math.min(90, v)))} suffix="%" step={5} w={40} /></div>
        <div><FL>Infl. fossiles</FL><NI value={fInfl} onChange={v => setFInfl(Math.max(0, Math.min(15, v)))} suffix="%/an" step={1} w={36} /></div>
        <div><FL>Infl. élec</FL><NI value={eInfl} onChange={v => setEInfl(Math.max(0, Math.min(10, v)))} suffix="%/an" step={1} w={36} /></div>
      </div>
      <div style={{ marginBottom: 10, padding: 8, borderRadius: 7, background: '#fef2f2' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>🏗️ Investissement année 1</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {inv.dpeJump > 0 && <tr><td style={tdS}>Rénovation ({inv.dpeJump} cl., {inv.renoPerM2}€/m²)</td><td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>{roundTen(inv.renoCost).toLocaleString('fr-FR')} €</td></tr>}
            {inv.heatingDelta > 0 && <tr><td style={tdS}>Δ Chauffage</td><td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>{roundTen(inv.heatingDelta).toLocaleString('fr-FR')} €</td></tr>}
            {inv.hwDelta > 0 && <tr><td style={tdS}>Δ ECS</td><td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>{roundTen(inv.hwDelta).toLocaleString('fr-FR')} €</td></tr>}
            {inv.cookDelta > 0 && <tr><td style={tdS}>Δ Cuisson</td><td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>{roundTen(inv.cookDelta).toLocaleString('fr-FR')} €</td></tr>}
            {inv.vehicleDelta > 0 && <tr><td style={tdS}>Δ Véhicule(s)</td><td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>{roundTen(inv.vehicleDelta).toLocaleString('fr-FR')} €</td></tr>}
            <tr><td style={thS}>Total brut</td><td style={{ ...thS, textAlign: 'right' }}>{roundTen(inv.totalInvestment).toLocaleString('fr-FR')} €</td></tr>
            <tr><td style={{ ...tdS, color: '#059669' }}>Aides ({aidPct}%)</td><td style={{ ...tdS, textAlign: 'right', color: '#059669', fontWeight: 600 }}>-{roundTen(aid).toLocaleString('fr-FR')} €</td></tr>
            <tr><td style={{ ...thS, fontWeight: 800 }}>Reste à charge</td><td style={{ ...thS, textAlign: 'right', fontWeight: 800 }}>{roundTen(net).toLocaleString('fr-FR')} €</td></tr>
          </tbody>
        </table>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 10 }}>
        <div style={{ padding: 6, borderRadius: 7, background: '#f0fdf4', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>{roundTen(cB - tB) > 0 ? '+' : ''}{roundTen(cB - tB).toLocaleString('fr-FR')} €</div>
          <div style={{ fontSize: 8, color: '#6b7280' }}>éco./an (an 1)</div>
        </div>
        <div style={{ padding: 6, borderRadius: 7, background: bk ? '#dbeafe' : '#fef3c7', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: bk ? '#2563eb' : '#d97706' }}>{bk ? `An ${bk.year}` : `>${years} ans`}</div>
          <div style={{ fontSize: 8, color: '#6b7280' }}>bascule</div>
        </div>
        <div style={{ padding: 6, borderRadius: 7, background: gain >= 0 ? '#f0fdf4' : '#fef2f2', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: gain >= 0 ? '#059669' : '#ef4444' }}>{gain >= 0 ? '+' : ''}{roundTen(gain).toLocaleString('fr-FR')} €</div>
          <div style={{ fontSize: 8, color: '#6b7280' }}>net à {years} ans</div>
        </div>
      </div>
      <div style={{ height: 220, marginBottom: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="year" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <RTooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} €`} labelFormatter={(l: string) => `Année ${l}`} contentStyle={{ fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {bk && <ReferenceLine x={bk.year} stroke="#2563eb" strokeDasharray="5 5" />}
            <Line type="monotone" dataKey="actuel" stroke="#ef4444" strokeWidth={2} name="Actuel (cumulé)" dot={false} />
            <Line type="monotone" dataKey="cible" stroke="#10b981" strokeWidth={2} name="Cible (cumulé)" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ── Methodology ── */
function Meth() {
  const ts: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 9, lineHeight: 1.3 }
  const th: React.CSSProperties = { textAlign: 'left', padding: '3px 5px', borderBottom: '2px solid #e5e7eb', fontWeight: 700, color: '#1f2937', background: '#f9fafb' }
  const td: React.CSSProperties = { padding: '3px 5px', borderBottom: '1px solid #f3f4f6', color: '#374151' }
  const h3s: React.CSSProperties = { margin: '12px 0 4px', fontSize: 11, fontWeight: 800, color: '#1f2937' }
  const ps: React.CSSProperties = { fontSize: 10, color: '#4b5563', lineHeight: 1.4, margin: '0 0 5px' }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 10px', border: '2px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#1f2937' }}>📐 Méthodologie</h3>
      <div style={{ padding: '8px 10px', borderRadius: 7, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 10, fontSize: 10, color: '#1e40af', lineHeight: 1.5 }}>
        <strong>Périmètre :</strong> Cet outil couvre exclusivement les <strong>usages électrifiables</strong> du logement (chauffage, ECS, cuisson) et de la mobilité personnelle. Il ne constitue ni un bilan carbone complet, ni un scope 1/2 au sens du GHG Protocol.
        <br />👉 Bilan complet : <a href="https://nosgestesclimat.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>Nos Gestes Climat</a> (ADEME).
      </div>
      <h3 style={h3s}>1. Logement (PCAF 2023)</h3>
      <table style={ts}><thead><tr><th style={th}>Équip.</th><th style={th}>kgCO₂/kWh</th><th style={th}>CAPEX</th><th style={th}>OPEX</th><th style={th}>Tot</th></tr></thead>
        <tbody>{HEATING.map(t => <tr key={t.id}><td style={td}>{t.label}</td><td style={td}>{t.ef}</td><td style={td}>{t.capex.toFixed(3)}</td><td style={td}>{t.opex.toFixed(2)}</td><td style={{ ...td, fontWeight: 600 }}>{(t.capex + t.opex).toFixed(2)}</td></tr>)}</tbody>
      </table>
      <h3 style={h3s}>2. Mobilité (Base Carbone 2020-2025)</h3>
      <table style={ts}><thead><tr><th style={th}>Mode</th><th style={th}>kgCO₂/km</th><th style={th}>CAPEX</th><th style={th}>OPEX</th><th style={th}>Tot</th></tr></thead>
        <tbody>{TRANSPORT_MODES.map(t => <tr key={t.id}><td style={td}>{t.label}</td><td style={td}>{t.ef}</td><td style={td}>{t.capex.toFixed(2)}</td><td style={td}>{t.opex.toFixed(2)}</td><td style={{ ...td, fontWeight: 600 }}>{(t.capex + t.opex).toFixed(2)}</td></tr>)}</tbody>
      </table>
      <h3 style={h3s}>3. Rénovation (€/m²)</h3>
      <table style={ts}><thead><tr><th style={th}>Saut</th><th style={th}>€/m²</th><th style={th}>80m²</th></tr></thead>
        <tbody>{Object.entries(RENOVATION_COST_PER_CLASS).map(([k, v]) => <tr key={k}><td style={td}>{k} cl.</td><td style={td}>{v}</td><td style={td}>{roundTen(v * 80).toLocaleString('fr-FR')} €</td></tr>)}</tbody>
      </table>
      <h3 style={h3s}>4. Sources</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, background: '#f0f0ff', border: '1px solid #c7c7ff', marginTop: 4 }}>
        <EcodexLogo size={28} />
        <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.4 }}>
          FE fournis par <a href="https://getecodex.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4856FF', fontWeight: 700, textDecoration: 'none' }}>Ecodex</a> (1M+ facteurs d'émission) via le <a href="https://getecodex.com/connect" target="_blank" rel="noopener noreferrer" style={{ color: '#4856FF', fontWeight: 600, textDecoration: 'none' }}>protocole MCP</a>. Sources : PCAF, Base Carbone ADEME, EEA.
        </div>
      </div>
    </div>
  )
}

/* ── Main App ── */
export default function App() {
  const [cur, setCur] = useState<Scenario>(PROFILES[1].cur)
  const [tgt, setTgt] = useState<Scenario>(PROFILES[1].tgt)
  const [tab, setTab] = useState('inputs')
  const [ap, setAp] = useState<string | null>(PROFILES[1].id)

  const selP = (p: typeof PROFILES[0]) => { setCur({ ...p.cur }); setTgt({ ...p.tgt }); setAp(p.id) }
  const cR = useMemo(() => computeAnnual(cur), [cur])
  const tR = useMemo(() => computeAnnual(tgt), [tgt])

  return (
    <div className="min-h-screen p-2.5 font-sans">
      <div style={{ textAlign: 'center', marginBottom: 10, maxWidth: 600, margin: '0 auto 10px' }}>
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-400 text-[9px] font-semibold text-amber-800 mb-1.5">
          ⚡ Crise énergétique — Évaluez votre exposition aux fossiles
        </div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight m-0">Mon Score d'Électrification</h1>
        <p className="text-[11px] text-gray-500 m-0">Logement + Mobilité · Émissions · Coûts · ROI</p>
      </div>

      <div className="flex justify-center gap-0.5 mb-2 flex-wrap">
        {[{ id: 'inputs', l: '📝 Scénarios' }, { id: 'results', l: '📊 Résultats' }, { id: 'biz', l: '💰 Business Case' }, { id: 'method', l: '📐 Méthodo' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-2.5 py-1 rounded text-[10px] font-bold border-none cursor-pointer transition-all ${tab === t.id ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {tab === 'inputs' && (
          <>
            <PSel onSelect={selP} activeId={ap} />
            <div className="flex gap-2 flex-wrap">
              <ScP title="Scénario actuel" emoji="📍" sc={cur} setSc={s => { setCur(s); setAp(null) }} accent="#ef4444" showWarn={false} />
              <ScP title="Scénario cible" emoji="🎯" sc={tgt} setSc={s => { setTgt(s); setAp(null) }} accent="#10b981" showWarn={true} />
            </div>
          </>
        )}
        {tab === 'results' && <Results cur={cR} tgt={tR} />}
        {tab === 'biz' && <BizCase curSc={cur} tgtSc={tgt} curR={cR} tgtR={tR} />}
        {tab === 'method' && <Meth />}
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-2.5 border-t border-gray-200">
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[9px] text-gray-400">Powered by</span>
          <a href="https://getecodex.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline">
            <EcodexLogo size={20} />
            <span className="text-[11px] font-extrabold" style={{ color: '#4856FF' }}>Ecodex</span>
          </a>
        </div>
      </div>
    </div>
  )
}
