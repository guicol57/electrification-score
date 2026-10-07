import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TRANSPORT_MODES, ELEC_SCORE_TIPS, FOSSIL_SCORE_TIPS } from '../data'
import {
  SECTORS, PRO_HEATING, PRO_HOT_WATER, FLEET_CATEGORIES, COMMUTE_MODES, ENERGIES, ENERGY_IDS,
  DEFAULT_PRICES, DEFAULT_COMMUTE_KM, DEFAULT_WORKING_DAYS, HEATING_W_PER_M2, CHARGER_COST, HEAT_PUMP_IDS,
  heatingTargetFor,
} from '../data/pro'
import type { EnergyId, FleetLine, Sector } from '../data/pro'
import {
  computeNeeds, computeProAnnual, computeMobility, computeBenchmark, buildLevers, evaluateLevers,
  applyLevers, cumulativeCosts, sectorById, fleetCategoryPerKm,
  type ProInput, type ProScenario, type ProAnnualResult, type LeverResult,
} from '../utils/computePro'
import { roundTen } from '../utils/score'
import { EcodexLogo, GitHubLogo } from '../components/EcodexLogo'
import { Sel, NI, FL, SL, Tip, BarR, Badge } from '../components/ui'

/* ── Helpers ── */

const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR')
const dec = (v: number, d: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
const num = (v: number) => v.toLocaleString('fr-FR')
const eur = (v: number) => `${roundTen(v).toLocaleString('fr-FR')} €`
const tCO2 = (kg: number) => `${(kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t`
const info = <span style={{ opacity: 0.5, cursor: 'help' }}>ⓘ</span>
const ACCENT = '#2563eb'

const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: '12px 10px', border: '2px solid #e5e7eb' }
const h3: React.CSSProperties = { margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#1f2937' }
const note: React.CSSProperties = { padding: '8px 10px', borderRadius: 7, fontSize: 12, lineHeight: 1.5 }

function inputFromSector(s: Sector, prev?: ProInput): ProInput {
  return {
    sectorId: s.id, area: s.defaults.area, staff: s.defaults.staff,
    buildingMode: 'ratio', realHeatingKwh: 0, realHotWaterKwh: 0, realElecOtherKwh: 0,
    heating: s.defaults.heating, hotWater: s.defaults.hotWater,
    fleet: s.defaults.fleet.map(l => ({ ...l })),
    travel: prev?.travel ?? [{ mode: 'tgv', km: 20000 }, { mode: 'plane_m', km: 10000 }],
    commute: prev?.commute ?? { kmOneWay: DEFAULT_COMMUTE_KM, days: DEFAULT_WORKING_DAYS, shares: Object.fromEntries(COMMUTE_MODES.map(m => [m.id, m.share])) },
    prices: prev?.prices ?? { ...DEFAULT_PRICES },
  }
}

/* ── Shareable state (encoded in the URL, no backend) ── */

interface SharedState { input: ProInput; off: string[]; aid: Record<string, number>; ht?: string }

function readSharedState(): SharedState | null {
  try {
    const s = new URLSearchParams(window.location.search).get('s')
    if (!s) return null
    const parsed = JSON.parse(decodeURIComponent(escape(atob(s)))) as SharedState
    return parsed?.input?.sectorId ? { ...parsed, input: { ...inputFromSector(sectorById(parsed.input.sectorId)), ...parsed.input } } : null
  } catch {
    return null
  }
}

function shareUrl(state: SharedState): string {
  const s = btoa(unescape(encodeURIComponent(JSON.stringify(state))))
  return `${window.location.origin}${window.location.pathname}?s=${s}`
}

/* ── Sector selector ── */

function SectorSel({ activeId, onSelect }: { activeId: string; onSelect: (s: Sector) => void }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Secteur (pré-remplit un profil type, ajustable)</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {SECTORS.map(s => (
          <button key={s.id} onClick={() => onSelect(s)} style={{
            padding: '7px 10px', borderRadius: 9,
            border: activeId === s.id ? '2px solid #1f2937' : '2px solid #e5e7eb',
            background: activeId === s.id ? '#1f2937' : '#fff',
            color: activeId === s.id ? '#fff' : '#374151',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', minWidth: 140, flex: '1 1 140px',
          }}>
            <div style={{ fontSize: 16 }}>{s.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Diagnostic inputs ── */

function ModeToggle({ value, onChange }: { value: ProInput['buildingMode']; onChange: (v: ProInput['buildingMode']) => void }) {
  const opts: Array<{ id: ProInput['buildingMode']; l: string }> = [{ id: 'ratio', l: 'Estimation sectorielle' }, { id: 'real', l: 'Consommations réelles' }]
  return (
    <div style={{ display: 'inline-flex', gap: 2, background: '#f3f4f6', borderRadius: 6, padding: 2 }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
          background: value === o.id ? '#1f2937' : 'transparent', color: value === o.id ? '#fff' : '#6b7280',
        }}>{o.l}</button>
      ))}
    </div>
  )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} title="Supprimer" style={{
      width: 20, height: 20, borderRadius: 4, border: 'none', background: '#fee2e2',
      color: '#dc2626', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>×</button>
  )
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ marginTop: 4, padding: '3px 9px', borderRadius: 5, border: `1px dashed ${ACCENT}66`, background: `${ACCENT}08`, color: ACCENT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      {label}
    </button>
  )
}

function BuildingCard({ input, set }: { input: ProInput; set: (p: Partial<ProInput>) => void }) {
  const r = sectorById(input.sectorId).ratios
  return (
    <div style={{ ...card, flex: '1 1 320px', minWidth: 290 }}>
      <SL color={ACCENT} icon="🏢" label="Bâtiment" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div><FL>Surface chauffée</FL><NI value={input.area} onChange={v => set({ area: Math.max(0, v) })} suffix="m²" step={50} w={80} /></div>
        <div><FL>Effectif</FL><NI value={input.staff} onChange={v => set({ staff: Math.max(0, v) })} suffix="salariés" step={1} w={60} /></div>
      </div>
      <div style={{ marginTop: 8 }}>
        <FL>Consommations <Tip below align="left" text={<>
          <strong>Estimation sectorielle</strong> : besoins calculés avec des ratios par m² propres au secteur (ordres de grandeur OPERAT / CEREN). Rapide, mais approximatif.<br /><br />
          <strong>Consommations réelles</strong> : saisissez les kWh annuels lus sur vos factures ou votre déclaration OPERAT. Recommandé pour un résultat fiable.
        </>}>{info}</Tip></FL>
        <ModeToggle value={input.buildingMode} onChange={v => {
          // First switch to real mode: start from the sector estimate rather than zeros
          if (v === 'real' && !input.realHeatingKwh && !input.realHotWaterKwh && !input.realElecOtherKwh) {
            const n = computeNeeds({ ...input, buildingMode: 'ratio' })
            const eff = (list: Array<{ id: string; efficiency: number }>, id: string) => list.find(x => x.id === id)?.efficiency ?? 1
            set({
              buildingMode: v,
              realHeatingKwh: Math.round(n.heating / eff(PRO_HEATING, input.heating)),
              realHotWaterKwh: Math.round(n.hotWater / eff(PRO_HOT_WATER, input.hotWater)),
              realElecOtherKwh: Math.round(n.elecOther),
            })
          } else set({ buildingMode: v })
        }} />
      </div>
      {input.buildingMode === 'ratio' ? (
        <div style={{ marginTop: 4, fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
          Ratios du secteur (kWh/m²/an) : chauffage {r.heatingNeed} utiles · eau chaude {r.hotWaterNeed} utiles · climatisation {r.cooling} · éclairage {r.lighting}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6, marginTop: 6 }}>
          <div><FL>Chauffage</FL><NI value={input.realHeatingKwh} onChange={v => set({ realHeatingKwh: Math.max(0, v) })} suffix="kWh/an" step={1000} w={84} /></div>
          <div><FL>Eau chaude</FL><NI value={input.realHotWaterKwh} onChange={v => set({ realHotWaterKwh: Math.max(0, v) })} suffix="kWh/an" step={500} w={84} /></div>
          <div><FL>Clim. + éclairage</FL><NI value={input.realElecOtherKwh} onChange={v => set({ realElecOtherKwh: Math.max(0, v) })} suffix="kWh/an" step={1000} w={84} /></div>
        </div>
      )}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div><FL>Chauffage actuel</FL><Sel value={input.heating} onChange={v => set({ heating: v })} options={PRO_HEATING.map(h => ({ value: h.id, label: h.label }))} /></div>
        <div><FL>Eau chaude actuelle</FL><Sel value={input.hotWater} onChange={v => set({ hotWater: v })} options={PRO_HOT_WATER.map(h => ({ value: h.id, label: h.label }))} /></div>
      </div>
    </div>
  )
}

function FleetCard({ fleet, setFleet }: { fleet: FleetLine[]; setFleet: (f: FleetLine[]) => void }) {
  const upd = (i: number, p: Partial<FleetLine>) => setFleet(fleet.map((l, j) => j === i ? { ...l, ...p } : l))
  return (
    <div style={{ ...card, flex: '1 1 320px', minWidth: 290 }}>
      <SL color={ACCENT} icon="🚐" label="Flotte de véhicules" />
      {fleet.length === 0 && <div style={{ fontSize: 12, color: '#9ca3af', padding: '4px 0' }}>Aucun véhicule.</div>}
      {fleet.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 170px', minWidth: 150 }}>
            <Sel value={l.category} onChange={v => upd(i, { category: v })} grouped
              options={FLEET_CATEGORIES.map(c => ({ value: c.id, label: c.label, cat: c.group }))} />
          </div>
          <NI value={l.count} onChange={v => upd(i, { count: Math.max(0, v) })} suffix="véh." step={1} w={46} title="Nombre de véhicules" />
          <NI value={l.kmPerVehicle} onChange={v => upd(i, { kmPerVehicle: Math.max(0, v) })} suffix="km/an/véh." step={1000} w={72} title="Kilométrage annuel par véhicule" />
          <RemoveBtn onClick={() => setFleet(fleet.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="+ Catégorie de véhicules" onClick={() => setFleet([...fleet, { category: 'car_diesel', count: 1, kmPerVehicle: 15000 }])} />
      <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
        Poids lourds et engins (chariots, chantier) : prévus dans une prochaine version.
      </div>
    </div>
  )
}

function MobilityCard({ input, set }: { input: ProInput; set: (p: Partial<ProInput>) => void }) {
  const c = input.commute
  const shareSum = COMMUTE_MODES.reduce((s, m) => s + (c.shares[m.id] ?? 0), 0)
  const updTravel = (i: number, p: Partial<ProInput['travel'][0]>) => set({ travel: input.travel.map((t, j) => j === i ? { ...t, ...p } : t) })
  return (
    <details style={{ ...card, flex: '1 1 100%' }}>
      <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        👥 Mobilité des salariés <span style={{ textTransform: 'none', fontWeight: 400, color: '#6b7280' }}>· facultatif, pré-rempli, affiché à part du score</span>
      </summary>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        <div style={{ flex: '1 1 300px' }}>
          <FL>Domicile-travail</FL>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <div><FL>Distance aller moyenne</FL><NI value={c.kmOneWay} onChange={v => set({ commute: { ...c, kmOneWay: Math.max(0, v) } })} suffix="km" step={1} w={54} /></div>
            <div><FL>Jours sur site</FL><NI value={c.days} onChange={v => set({ commute: { ...c, days: Math.max(0, Math.min(365, v)) } })} suffix="j/an" step={5} w={54} /></div>
          </div>
          <FL>Répartition des salariés par mode <Tip below align="left" text="Valeurs par défaut : moyenne nationale Insee (voiture 70 %, transports en commun 16 %, marche 7 %, deux-roues 4 %, sans déplacement 3 %). Remplacez-les par le résultat d'une enquête interne si vous en avez une.">{info}</Tip></FL>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2px 10px' }}>
            {COMMUTE_MODES.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, fontSize: 12 }}>
                <span>{m.label}</span>
                <NI value={c.shares[m.id] ?? 0} onChange={v => set({ commute: { ...c, shares: { ...c.shares, [m.id]: Math.max(0, Math.min(100, v)) } } })} suffix="%" step={1} w={46} />
              </div>
            ))}
          </div>
          {Math.round(shareSum) !== 100 && <div style={{ marginTop: 4, fontSize: 11, color: '#b45309' }}>⚠️ La répartition totalise {shareSum} % (attendu : 100 %).</div>}
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <FL>Déplacements professionnels (distances annuelles, tous salariés)</FL>
          {input.travel.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <Sel value={t.mode} onChange={v => updTravel(i, { mode: v })} grouped options={TRANSPORT_MODES.map(x => ({ value: x.id, label: x.label, cat: x.category }))} />
              </div>
              <NI value={t.km} onChange={v => updTravel(i, { km: Math.max(0, v) })} suffix="km/an" step={1000} w={76} />
              <RemoveBtn onClick={() => set({ travel: input.travel.filter((_, j) => j !== i) })} />
            </div>
          ))}
          <AddBtn label="+ Mode de transport" onClick={() => set({ travel: [...input.travel, { mode: 'ter', km: 5000 }] })} />
        </div>
      </div>
    </details>
  )
}

function PricesCard({ input, set }: { input: ProInput; set: (p: Partial<ProInput>) => void }) {
  return (
    <details style={{ ...card, flex: '1 1 100%' }}>
      <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        ⚙️ Prix de l'énergie <span style={{ textTransform: 'none', fontWeight: 400, color: '#6b7280' }}>· hors TVA, moyennes France d'octobre 2026, ajustables selon vos contrats</span>
      </summary>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
        {ENERGY_IDS.map((id: EnergyId) => {
          const e = ENERGIES[id]
          const k = e.displayUnit?.kwhPerUnit ?? 1
          return (
            <div key={id}>
              <FL>{e.label}</FL>
              <NI value={Math.round(input.prices[id] * k * 1000) / 1000} step={0.01} w={64}
                suffix={e.displayUnit?.label ?? '€/kWh'}
                onChange={v => set({ prices: { ...input.prices, [id]: Math.max(0, v) / k } })} />
            </div>
          )
        })}
      </div>
      <button onClick={() => set({ prices: { ...DEFAULT_PRICES } })} style={{ marginTop: 8, padding: '3px 9px', borderRadius: 5, border: '1px solid #d1d5db', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
        Revenir aux valeurs par défaut
      </button>
    </details>
  )
}

/* ── Results ── */

function ScorePair({ title, r, bg }: { title: string; r: ProAnnualResult; bg: string }) {
  return (
    <div style={{ padding: 8, borderRadius: 8, background: bg, flex: '1 1 200px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Badge grade={r.elecScore.g} color={r.elecScore.c} label={`Élec. ${Math.round(r.electricPct)}%`} sub={r.elecScore.t} tip={ELEC_SCORE_TIPS[r.elecScore.g]} />
        <Badge grade={r.fossilScore.g} color={r.fossilScore.c} label={`Fossiles ${Math.round(r.fossilPct)}%`} sub={`Exp. ${r.fossilScore.t.toLowerCase()}`} tip={FOSSIL_SCORE_TIPS[r.fossilScore.g]} />
      </div>
    </div>
  )
}

function Results({ input, cur }: { input: ProInput; cur: ProAnnualResult }) {
  const [mode, setMode] = useState<'kwh' | 'co2' | 'eur'>('kwh')
  const bench = useMemo(() => computeBenchmark(input, cur), [input, cur])
  const mob = useMemo(() => computeMobility(input), [input])
  const sector = sectorById(input.sectorId)
  const val = (l: ProAnnualResult['lines'][0]) => mode === 'kwh' ? Object.values(l.kwh).reduce((a, b) => a + (b ?? 0), 0) : mode === 'co2' ? l.co2 : l.cost
  const sfx = mode === 'kwh' ? 'kWh' : mode === 'co2' ? 'kgCO₂' : '€ HT'
  const mx = Math.max(1, ...cur.lines.map(val))
  const kpi = (value: string, label: string, tip: string, color = '#1f2937') => (
    <Tip text={tip}>
      <div style={{ padding: 6, borderRadius: 7, background: '#f9fafb', textAlign: 'center', cursor: 'help', minWidth: 120 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
        <div style={{ fontSize: 10, color: '#6b7280' }}>{label} {info}</div>
      </div>
    </Tip>
  )

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <h3 style={{ ...h3, margin: 0 }}>📊 Résultats · situation actuelle</h3>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <ScorePair title="Bâtiment + flotte" r={cur} bg="#eff6ff" />
        <div style={{ flex: '2 1 300px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 5 }}>
          {kpi(tCO2(cur.totalCO2), 'CO₂e / an', "Émissions annuelles des usages couverts (bâtiment + flotte) : combustion, amont des énergies et fabrication des véhicules. Ce n'est pas un bilan carbone complet.")}
          {kpi(eur(cur.totalCost), 'HT / an', "Facture énergétique annuelle hors TVA, entretien des équipements et des véhicules inclus, hors amortissement.")}
          {kpi(`${Math.round(cur.buildingElecPct)} %`, 'bâtiment électrifié', "Part de l'électricité dans l'énergie finale du bâtiment (chauffage, eau chaude, climatisation, éclairage).", ACCENT)}
          {kpi(cur.fleetKwh > 0 ? `${Math.round(cur.fleetElecPct)} %` : '·', 'flotte électrifiée', "Part de l'électricité dans l'énergie consommée par la flotte.", ACCENT)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 6px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Répartition par usage</span>
        <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', borderRadius: 6, padding: 2 }}>
          {([{ id: 'kwh', l: '⚡ Énergie' }, { id: 'co2', l: '🌍 CO₂' }, { id: 'eur', l: '💰 Coûts' }] as const).map(t => (
            <button key={t.id} onClick={() => setMode(t.id)} style={{
              padding: '4px 10px', borderRadius: 5, border: 'none', background: mode === t.id ? '#1f2937' : 'transparent',
              color: mode === t.id ? '#fff' : '#6b7280', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>{t.l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
        {(['building', 'fleet'] as const).map(f => (
          <div key={f}>
            <div style={{ fontSize: 11, fontWeight: 700, color: f === 'building' ? '#ef4444' : '#8b5cf6', marginBottom: 3, textTransform: 'uppercase' }}>{f === 'building' ? '🏢 Bâtiment' : '🚐 Flotte'}</div>
            {cur.lines.filter(l => l.family === f).map(l => (
              <BarR key={l.id} value={val(l)} max={mx} color={f === 'building' ? '#ef4444' : '#8b5cf6'} label={l.label} suffix={sfx} />
            ))}
            {f === 'fleet' && !cur.lines.some(l => l.family === 'fleet') && <div style={{ fontSize: 11, color: '#9ca3af' }}>Aucun véhicule renseigné.</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8, marginTop: 12 }}>
        <div style={{ ...note, background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}>
          <strong>📏 Repère sectoriel · {sector.label}</strong> <Tip below align="left" text={`Référence calculée avec les ratios du secteur et l'équipement type du secteur (${PRO_HEATING.find(h => h.id === sector.defaults.heating)?.label}). C'est un ordre de grandeur issu des hypothèses du simulateur, pas une moyenne statistique.`}>{info}</Tip>
          <table style={{ width: '100%', marginTop: 4, borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr><th style={{ textAlign: 'left', fontWeight: 600 }}></th><th style={{ textAlign: 'right', fontWeight: 600 }}>Vous</th><th style={{ textAlign: 'right', fontWeight: 600 }}>Référence</th></tr></thead>
            <tbody>
              <tr><td>Énergie finale du bâtiment</td><td style={{ textAlign: 'right' }}>{fmt(bench.userKwhPerM2)} kWh/m²</td><td style={{ textAlign: 'right' }}>{fmt(bench.refKwhPerM2)} kWh/m²</td></tr>
              <tr><td>Part électrique du bâtiment</td><td style={{ textAlign: 'right' }}>{Math.round(bench.userElecPct)} %</td><td style={{ textAlign: 'right' }}>{Math.round(bench.refElecPct)} %</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ ...note, background: '#faf5ff', border: '1px solid #e9d5ff', color: '#374151' }}>
          <strong>👥 Mobilité des salariés</strong> <Tip below align="left" text="Hors score principal : l'entreprise ne choisit pas le véhicule de ses salariés. L'indicateur mesure la part des kilomètres parcourus en modes électriques ou actifs (vélo, marche) ; les hybrides rechargeables comptent pour moitié.">{info}</Tip>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge grade={mob.nonFossilScore.g} color={mob.nonFossilScore.c} label={`${Math.round(mob.nonFossilKmPct)} % km non fossiles`} sub={`${fmt(mob.totalKm)} km/an`} tip="Part des kilomètres (domicile-travail + déplacements professionnels) parcourus sans énergie fossile." />
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              Domicile-travail : <strong>{tCO2(mob.commuteCO2)}</strong> CO₂e/an<br />
              Déplacements pro : <strong>{tCO2(mob.travelCO2)}</strong> CO₂e/an
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Action plan + business case ── */

function AidsTip() {
  const a = (href: string, l: string) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd' }}>{l}</a>
  return (
    <Tip interactive below align="left" text={<>
      <strong>Aides mobilisables par les entreprises</strong> (conditions et montants à vérifier) :<br /><br />
      🏢 <strong>Bâtiment</strong><br />
      • {a('https://www.ecologie.gouv.fr/politiques-publiques/dispositif-certificats-deconomies-denergie', 'CEE tertiaire')} : primes des fournisseurs d'énergie pour les PAC et chauffe-eau thermodynamiques<br />
      • {a('https://agirpourlatransition.ademe.fr/entreprises/aides-financieres', 'Fonds Chaleur ADEME')} : chaleur renouvelable, selon éligibilité du projet<br /><br />
      🚐 <strong>Flotte</strong><br />
      • {a('https://advenir.mobi', 'Programme Advenir')} : aide à l'installation de points de charge<br /><br />
      ⚙️ <strong>Procédés</strong> (version 2) : {a('https://www.economie.gouv.fr/france-2030', 'France 2030')}<br /><br />
      Taux par défaut : 20 % pour les équipements du bâtiment, 0 % pour la flotte. Ajustez-les ligne par ligne.
    </>}>{info}</Tip>
  )
}

/** Explains an inflation rate with the prices currently entered (excl. VAT) */
function InflationTip({ kind, rate, prices }: { kind: 'fossil' | 'elec'; rate: number; prices: ProInput['prices'] }) {
  const at = (p: number, y: number) => p * Math.pow(1 + rate / 100, y)
  const diesel = prices.diesel * (ENERGIES.diesel.displayUnit?.kwhPerUnit ?? 1)
  const row = (label: string, p: number, d: number, unit: string) => <>• {label} : {dec(p, d)} {unit}<br /></>
  return (
    <Tip align="left" below text={kind === 'fossil' ? <>
      <strong>Que signifie +{rate} %/an ?</strong><br /><br />
      Avec un gazole à {dec(diesel, 2)} €/L HT aujourd'hui :<br />
      {row('Dans 1 an', at(diesel, 1), 2, '€/L')}
      {row('Dans 5 ans', at(diesel, 5), 2, '€/L')}
      {row('Dans 10 ans', at(diesel, 10), 2, '€/L')}<br />
      Avec un gaz à {dec(prices.gas, 3)} €/kWh HT aujourd'hui :<br />
      {row('Dans 5 ans', at(prices.gas, 5), 3, '€/kWh')}
      {row('Dans 10 ans', at(prices.gas, 10), 3, '€/kWh')}<br />
      <em>Plus l'inflation fossile est élevée, plus l'électrification devient rentable rapidement.</em>
    </> : <>
      <strong>Que signifie +{rate} %/an ?</strong><br /><br />
      Avec une électricité à {dec(prices.elec, 3)} €/kWh HT aujourd'hui :<br />
      {row('Dans 1 an', at(prices.elec, 1), 3, '€/kWh')}
      {row('Dans 5 ans', at(prices.elec, 5), 3, '€/kWh')}
      {row('Dans 10 ans', at(prices.elec, 10), 3, '€/kWh')}<br />
      <em>L'électricité a historiquement une inflation plus faible que les énergies fossiles en France, grâce au nucléaire et aux renouvelables.</em>
    </>}>{info}</Tip>
  )
}

function Plan({ input, cur, levers, off, setOff, aid, setAid, heatingTarget, setHeatingTarget, tgt, netInvestment }: {
  input: ProInput; cur: ProAnnualResult; levers: LeverResult[]
  off: string[]; setOff: (v: string[]) => void
  aid: Record<string, number>; setAid: (v: Record<string, number>) => void
  heatingTarget: string; setHeatingTarget: (v: string) => void
  tgt: ProAnnualResult; netInvestment: number
}) {
  const [years, setYears] = useState(15)
  const [fInfl, setFInfl] = useState(5)
  const [eInfl, setEInfl] = useState(2)
  const data = useMemo(() => cumulativeCosts(cur, tgt, netInvestment, years, fInfl, eInfl).map(p => ({ year: p.year, actuel: roundTen(p.actuel), cible: roundTen(p.cible) })), [cur, tgt, netInvestment, years, fInfl, eInfl])
  const bk = data.find(d => d.year > 0 && d.actuel >= d.cible)
  const gain = (data[data.length - 1]?.actuel || 0) - (data[data.length - 1]?.cible || 0)
  const savings = cur.totalCost - tgt.totalCost
  const co2Red = cur.totalCO2 > 0 ? (cur.totalCO2 - tgt.totalCO2) / cur.totalCO2 * 100 : 0
  const td: React.CSSProperties = { padding: '5px 6px', borderBottom: '1px solid #f3f4f6', fontSize: 12, color: '#374151', verticalAlign: 'middle' }
  const th: React.CSSProperties = { padding: '5px 6px', borderBottom: '2px solid #e5e7eb', fontSize: 11, fontWeight: 700, color: '#1f2937', textAlign: 'left', background: '#f9fafb', whiteSpace: 'nowrap' }
  const showHeatingChoice = levers.some(l => l.id === 'heating')

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={h3}>🎯 Plan d'actions · classé par temps de retour</h3>
        <span style={{ fontSize: 12, color: '#374151' }}>Aides mobilisables <AidsTip /></span>
      </div>
      {levers.length === 0 ? (
        <div style={{ ...note, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
          Bâtiment et flotte sont déjà électrifiés : aucune bascule à proposer sur le périmètre couvert.
        </div>
      ) : (
        <>
          <div style={{ ...note, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', marginBottom: 8 }}>
            Chaque ligne est une bascule vers l'électrique, chiffrée seule par rapport à la situation actuelle. Cochez celles qui composent votre <strong>scénario cible</strong>. Les véhicules sont remplacés au renouvellement : seul le surcoût de l'électrique et le point de charge sont comptés.
          </div>
          {showHeatingChoice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              <FL>Technologie de chauffage cible</FL>
              <div style={{ width: 260 }}>
                <Sel value={heatingTarget} onChange={setHeatingTarget} options={PRO_HEATING.filter(h => HEAT_PUMP_IDS.includes(h.id)).map(h => ({ value: h.id, label: h.label }))} />
              </div>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead><tr>
                <th style={th}></th><th style={th}>Bascule</th>
                <th style={{ ...th, textAlign: 'right' }}>Invest. brut</th>
                <th style={{ ...th, textAlign: 'right' }}>Aides</th>
                <th style={{ ...th, textAlign: 'right' }}>Invest. net</th>
                <th style={{ ...th, textAlign: 'right' }}>Économie / an</th>
                <th style={{ ...th, textAlign: 'right' }}>CO₂e évité / an</th>
                <th style={{ ...th, textAlign: 'right' }}>Retour</th>
              </tr></thead>
              <tbody>
                {levers.map(l => {
                  const on = !off.includes(l.id)
                  return (
                    <tr key={l.id} style={{ opacity: on ? 1 : 0.5 }}>
                      <td style={td}><input type="checkbox" checked={on} onChange={e => setOff(e.target.checked ? off.filter(x => x !== l.id) : [...off, l.id])} /></td>
                      <td style={td}><div style={{ fontWeight: 600 }}>{l.label}</div><div style={{ fontSize: 11, color: '#6b7280' }}>{l.detail}</div></td>
                      <td style={{ ...td, textAlign: 'right' }}>{eur(l.investment)}</td>
                      <td style={{ ...td, textAlign: 'right' }}><div style={{ display: 'inline-flex' }}><NI value={l.aidPct} onChange={v => setAid({ ...aid, [l.id]: Math.max(0, Math.min(90, v)) })} suffix="%" step={5} w={44} /></div></td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{eur(l.netInvestment)}</td>
                      <td style={{ ...td, textAlign: 'right', color: l.annualSavings >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>{l.annualSavings >= 0 ? '+' : '−'}{eur(Math.abs(l.annualSavings))}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{tCO2(l.co2Avoided)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{Number.isFinite(l.payback) ? `${l.payback.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ans` : 'non rentable'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 style={{ ...h3, marginTop: 16 }}>💰 Scénario cible et business case</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <ScorePair title="Actuel" r={cur} bg="#fef2f2" />
        <ScorePair title="Cible" r={tgt} bg="#f0fdf4" />
        <div style={{ flex: '2 1 300px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 5 }}>
          {[
            { v: eur(netInvestment), l: 'investissement net', c: '#1f2937', t: "Somme des investissements nets d'aides des bascules cochées." },
            { v: `${savings >= 0 ? '+' : '−'}${eur(Math.abs(savings))}`, l: 'économie / an (an 1)', c: savings >= 0 ? '#059669' : '#dc2626', t: "Économie annuelle HT sur l'énergie et l'entretien, hors investissement, la première année." },
            { v: `−${Math.round(co2Red)} %`, l: `CO₂e · ${tCO2(cur.totalCO2 - tgt.totalCO2)} évitées/an`, c: '#059669', t: "Réduction des émissions annuelles du bâtiment et de la flotte." },
            { v: bk ? `An ${bk.year}` : `> ${years} ans`, l: 'bascule', c: bk ? '#2563eb' : '#d97706', t: "Année où le coût cumulé du scénario cible (investissement compris) passe sous celui du scénario actuel." },
            { v: `${gain >= 0 ? '+' : '−'}${eur(Math.abs(gain))}`, l: `net à ${years} ans`, c: gain >= 0 ? '#059669' : '#dc2626', t: `Écart de coût cumulé à ${years} ans entre l'actuel et la cible, investissement inclus, avec l'inflation différenciée des énergies.` },
          ].map(k => (
            <Tip key={k.l} text={k.t}>
              <div style={{ padding: 6, borderRadius: 7, background: '#f9fafb', textAlign: 'center', cursor: 'help' }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: k.c }}>{k.v}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{k.l} {info}</div>
              </div>
            </Tip>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <div><FL>Durée</FL><NI value={years} onChange={v => setYears(Math.max(3, Math.min(25, v)))} suffix="ans" step={1} w={48} /></div>
        <div><FL>Inflation fossiles <InflationTip kind="fossil" rate={fInfl} prices={input.prices} /></FL><NI value={fInfl} onChange={v => setFInfl(Math.max(0, Math.min(15, v)))} suffix="%/an" step={1} w={48} /></div>
        <div><FL>Inflation électricité <InflationTip kind="elec" rate={eInfl} prices={input.prices} /></FL><NI value={eInfl} onChange={v => setEInfl(Math.max(0, Math.min(10, v)))} suffix="%/an" step={1} w={48} /></div>
      </div>
      <div style={{ height: 220, marginBottom: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <RTooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} € HT`} labelFormatter={(l: string) => `Année ${l}`} contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {bk && <ReferenceLine x={bk.year} stroke="#2563eb" strokeDasharray="5 5" />}
            <Line type="monotone" dataKey="actuel" stroke="#ef4444" strokeWidth={2} name="Actuel (cumulé)" dot={false} />
            <Line type="monotone" dataKey="cible" stroke="#10b981" strokeWidth={2} name="Cible (cumulé)" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ ...note, background: '#fefce8', border: '1px solid #fde68a', color: '#92400e', fontSize: 11 }}>
        <strong>⚠️ Avertissement :</strong> projections indicatives fondées sur des hypothèses simplifiées (ratios sectoriels, prix moyens, inflation constante, taux d'aide forfaitaires). Elles ne remplacent ni un audit énergétique ni une étude de dimensionnement, et ne constituent pas un conseil financier. La fiscalité des véhicules (taxes annuelles, amortissement) n'est pas modélisée.
      </div>
    </div>
  )
}

/* ── Methodology ── */

function Meth({ prices }: { prices: ProInput['prices'] }) {
  const ts: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 11, lineHeight: 1.3 }
  const th: React.CSSProperties = { textAlign: 'left', padding: '3px 5px', borderBottom: '2px solid #e5e7eb', fontWeight: 700, color: '#1f2937', background: '#f9fafb' }
  const td: React.CSSProperties = { padding: '3px 5px', borderBottom: '1px solid #f3f4f6', color: '#374151' }
  const h: React.CSSProperties = { margin: '12px 0 4px', fontSize: 13, fontWeight: 800, color: '#1f2937' }
  const ps: React.CSSProperties = { fontSize: 12, color: '#4b5563', lineHeight: 1.5, margin: '0 0 5px' }
  const a = (href: string, l: string) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{l}</a>
  return (
    <div style={card}>
      <h3 style={{ ...h3, marginBottom: 4 }}>📐 Méthodologie · version Entreprise</h3>
      <div style={{ ...note, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', marginBottom: 10 }}>
        <strong>Périmètre :</strong> usages électrifiables du <strong>bâtiment</strong> (chauffage, eau chaude, climatisation, éclairage) et de la <strong>flotte</strong> (voitures, utilitaires). La mobilité des salariés est évaluée à part. Ce n'est ni un bilan carbone réglementaire (BEGES, GHG Protocol), ni un audit énergétique. Procédés industriels, poids lourds et engins : prochaines versions.
      </div>

      <h3 style={h}>1. Score</h3>
      <p style={ps}>Le score d'électrification est la part de l'électricité dans l'énergie finale (kWh) du bâtiment et de la flotte. L'exposition aux fossiles est la part du gaz, du fioul, du gazole et de l'essence. Le réseau de chaleur n'est compté dans aucune des deux. Les seuils A→E sont ceux de la version Particulier.</p>

      <h3 style={h}>2. Bâtiment</h3>
      <p style={ps}>
        <strong>Besoins utiles.</strong> En estimation sectorielle, besoin = ratio du secteur (kWh utiles/m²/an) × surface. Les ratios sont des ordres de grandeur cohérents avec les fourchettes publiées à partir d'{a('https://operat.ademe.fr', 'OPERAT')} et du {a('https://www.ceren.fr', 'CEREN')} (bureaux 100 à 200 kWh/m²/an, chauffage autour de la moitié de la consommation). En consommations réelles, besoin = kWh saisis × rendement de l'équipement actuel.
        <br /><strong>Énergie finale</strong> = besoin ÷ rendement (ou SCOP pour une PAC). Puissance de chauffage : {HEATING_W_PER_M2} W/m².
        <br /><strong>Investissement</strong> = puissance × coût au kW du nouvel équipement, moins 30 % de la valeur de l'équipement remplacé (même convention que la version Particulier).
      </p>
      <table style={ts}><thead><tr><th style={th}>Chauffage</th><th style={th}>Énergie</th><th style={th}>Rendement / SCOP</th><th style={th}>€ HT/kW installé</th><th style={th}>Entretien € HT/kW/an</th></tr></thead>
        <tbody>{PRO_HEATING.map(x => <tr key={x.id}><td style={td}>{x.label}</td><td style={td}>{ENERGIES[x.energy].label}</td><td style={td}>{num(x.efficiency)}</td><td style={td}>{x.costPerKw}</td><td style={td}>{x.maintPerKw}</td></tr>)}</tbody>
      </table>
      <table style={{ ...ts, marginTop: 6 }}><thead><tr><th style={th}>Eau chaude</th><th style={th}>Énergie</th><th style={th}>Rendement / COP</th><th style={th}>€ HT par kWh utile annuel</th></tr></thead>
        <tbody>{PRO_HOT_WATER.map(x => <tr key={x.id}><td style={td}>{x.label}</td><td style={td}>{ENERGIES[x.energy].label}</td><td style={td}>{num(x.efficiency)}</td><td style={td}>{num(x.costPerAnnualKwh)}</td></tr>)}</tbody>
      </table>

      <h3 style={h}>3. Flotte</h3>
      <p style={ps}>
        Émissions par km = consommation × facteur d'émission de l'énergie + fabrication du véhicule. Fabrication : Base Carbone ADEME via Ecodex (voiture gazole 0,041 kgCO₂e/km, voiture électrique 0,079 kgCO₂e/km ; utilitaires : × 1,2, hypothèse). Totaux recoupés avec la Base Carbone (voiture gazole 0,24 kgCO₂e/km) et DEFRA 2026 (utilitaire diesel 0,318 kgCO₂e/km hors fabrication).
        <br />Bascule : remplacement au renouvellement. Investissement = surcoût du modèle électrique + un point de charge par véhicule ({fmt(CHARGER_COST)} € HT).
      </p>
      <table style={ts}><thead><tr><th style={th}>Catégorie</th><th style={th}>Consommation</th><th style={th}>kgCO₂e/km</th><th style={th}>€ HT/km (énergie + entretien)</th><th style={th}>Prix d'achat € HT</th></tr></thead>
        <tbody>{FLEET_CATEGORIES.map(c => {
          const pk = fleetCategoryPerKm(c.id, prices)
          const conso = [c.fuelL100 > 0 ? `${num(c.fuelL100)} L/100 km` : '', c.elecKwh100 > 0 ? `${num(c.elecKwh100)} kWh/100 km` : ''].filter(Boolean).join(' + ')
          return <tr key={c.id}><td style={td}>{c.label}</td><td style={td}>{conso}</td><td style={td}>{dec(pk.co2, 3)}</td><td style={td}>{dec(pk.cost, 3)}</td><td style={td}>{fmt(c.price)}</td></tr>
        })}</tbody>
      </table>

      <h3 style={h}>4. Énergies</h3>
      <table style={ts}><thead><tr><th style={th}>Énergie</th><th style={th}>kgCO₂e/kWh</th><th style={th}>Prix par défaut (HT)</th><th style={th}>Classement</th></tr></thead>
        <tbody>{ENERGY_IDS.map(id => {
          const e = ENERGIES[id]
          return <tr key={id}><td style={td}>{e.label}</td><td style={td}>{dec(e.ef, 3)}</td><td style={td}>{e.displayUnit ? `${dec(DEFAULT_PRICES[id] * e.displayUnit.kwhPerUnit, 2)} ${e.displayUnit.label}` : `${dec(DEFAULT_PRICES[id], 2)} €/kWh`}</td><td style={td}>{e.kind === 'fossil' ? 'Fossile' : e.kind === 'electric' ? 'Électrique' : 'Autre'}</td></tr>
        })}</tbody>
      </table>
      <p style={{ ...ps, marginTop: 4 }}>Facteurs d'émission : Base Carbone ADEME via {a('https://getecodex.com', 'Ecodex')} (combustion + amont). Gazole 3,48 kgCO₂e/L et essence E10 2,84 kgCO₂e/L (Base Carbone 2026). Prix par défaut : moyennes France de début octobre 2026, converties hors TVA (TTC ÷ 1,2) : gazole 2,363 €/L et SP95-E10 2,144 €/L TTC ({a('https://prix-carburant.eu/article/prix-carburants-2026-10-03', 'prix-carburant.eu')}, 3 octobre), fioul 1,827 €/L TTC ({a('https://prixfioul.fr', 'prixfioul.fr')}), gaz 0,1456 €/kWh TTC ({a('https://www.fournisseurs-electricite.com/contrat-gaz/prix/prix-repere', 'prix repère CRE')}, profil chauffage), électricité 0,1624 €/kWh HTVA ({a('https://entreprises.selectra.info/energie/electricite/tarifs-professionnels', 'Tarif Bleu Pro')}, option Base, accise incluse). Réseau de chaleur : 104,7 € HT/MWh, moyenne nationale 2024 (SNCU), dernière publiée. Abonnements non inclus ; ajustez selon vos contrats.</p>

      <h3 style={h}>5. Mobilité des salariés</h3>
      <p style={ps}>
        Domicile-travail = effectif × part modale × distance aller × 2 × jours sur site. Parts modales par défaut : {a('https://www.insee.fr/fr/statistiques/3714237', 'Insee Focus n°143')} (voiture 70 %, transports en commun 16 %, marche 7 %, deux-roues 4 %, sans déplacement 3 %). Facteurs d'émission par passager.km : ceux de la version Particulier (Base Carbone ADEME). Indicateur : part des km parcourus sans énergie fossile, les hybrides rechargeables comptant pour moitié.
      </p>

      <h3 style={h}>6. Limites</h3>
      <p style={ps}>Un seul site. Pas de poids lourds, d'engins ni de procédés industriels. Les ratios sectoriels ne remplacent pas les consommations réelles. Le business case ne modélise ni la fiscalité des véhicules, ni l'évolution des tarifs d'acheminement, ni le coût du capital.</p>
    </div>
  )
}

/* ── Page ── */

type Section = 'diagnostic' | 'results' | 'plan'

export default function Entreprise() {
  const shared = useMemo(readSharedState, [])
  const [input, setInput] = useState<ProInput>(() => shared?.input ?? inputFromSector(SECTORS[0]))
  const [off, setOff] = useState<string[]>(shared?.off ?? [])
  const [aid, setAid] = useState<Record<string, number>>(shared?.aid ?? {})
  const [heatingTarget, setHeatingTarget] = useState<string>(shared?.ht ?? heatingTargetFor(input.heating))
  const [tab, setTab] = useState<'home' | 'method'>('home')
  const [copied, setCopied] = useState(false)

  const set = (p: Partial<ProInput>) => {
    if (p.heating !== undefined) setHeatingTarget(heatingTargetFor(p.heating))
    setInput(prev => ({ ...prev, ...p }))
  }
  const selectSector = (s: Sector) => {
    const next = inputFromSector(s, input)
    setInput(next); setOff([]); setAid({}); setHeatingTarget(heatingTargetFor(next.heating))
  }

  const needs = useMemo(() => computeNeeds(input), [input])
  const current: ProScenario = useMemo(() => ({ heating: input.heating, hotWater: input.hotWater, fleet: input.fleet }), [input])
  const cur = useMemo(() => computeProAnnual(input, needs, current), [input, needs, current])
  const leverDefs = useMemo(() => buildLevers(input, needs, current, heatingTarget), [input, needs, current, heatingTarget])
  const levers = useMemo(() => evaluateLevers(input, needs, current, leverDefs, aid), [input, needs, current, leverDefs, aid])
  const selected = levers.filter(l => !off.includes(l.id))
  const tgt = useMemo(
    () => computeProAnnual(input, needs, applyLevers(current, leverDefs, leverDefs.map(l => l.id).filter(id => !off.includes(id)))),
    [input, needs, current, leverDefs, off],
  )
  const netInvestment = selected.reduce((s, l) => s + l.netInvestment, 0)

  const goTo = (id: Section) => {
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (tab !== 'home') { setTab('home'); requestAnimationFrame(go) } else go()
  }
  const copyLink = () => {
    const url = shareUrl({ input, off, aid, ht: heatingTarget })
    window.history.replaceState(null, '', url)
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }

  const nav: Array<{ l: string; onClick: () => void; active: boolean }> = [
    { l: '📝 Diagnostic', onClick: () => goTo('diagnostic'), active: false },
    { l: '📊 Résultats', onClick: () => goTo('results'), active: false },
    { l: "🎯 Plan d'actions", onClick: () => goTo('plan'), active: false },
    { l: '📐 Méthodo', onClick: () => { setTab('method'); window.scrollTo({ top: 0, behavior: 'smooth' }) }, active: tab === 'method' },
  ]

  return (
    <div className="min-h-screen font-sans">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 px-2.5 pt-2.5 pb-2">
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto 8px' }}>
          <Link to="/" className="absolute left-0 top-1 text-[11px] text-gray-500 hover:text-gray-800 no-underline" title="Retour à l'accueil">← Accueil</Link>
          <div style={{ textAlign: 'center' }}>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-300 text-[11px] font-semibold text-blue-800 mb-1.5">
              🏢 Version Entreprise · TPE / PME
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight m-0">Mon Score d'Électrification Pro</h1>
            <p className="text-[13px] text-gray-500 m-0">Bâtiment + Flotte · Mobilité des salariés</p>
          </div>
        </div>
        <div className="flex justify-center gap-0.5 flex-wrap">
          {nav.map(t => (
            <button type="button" key={t.l} onClick={t.onClick} className={`px-2.5 py-1 rounded text-[12px] font-bold border-none cursor-pointer transition-all ${t.active ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-2.5">
        {tab === 'home' ? (
          <>
            <section id="diagnostic" className="scroll-mt-32">
              <div style={{ ...note, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', marginBottom: 8 }}>
                <strong>Comment utiliser ce simulateur ?</strong> Choisissez votre secteur : un profil type pré-remplit le diagnostic en quelques secondes. Ajustez ensuite la surface, les équipements et la flotte, et saisissez vos consommations réelles si vous les avez. Les résultats et le plan d'actions se mettent à jour en direct.
              </div>
              <SectorSel activeId={input.sectorId} onSelect={selectSector} />
              <div className="flex gap-2 flex-wrap">
                <BuildingCard input={input} set={set} />
                <FleetCard fleet={input.fleet} setFleet={fleet => set({ fleet })} />
                <MobilityCard input={input} set={set} />
                <PricesCard input={input} set={set} />
              </div>
            </section>
            <section id="results" className="scroll-mt-32 mt-6">
              <Results input={input} cur={cur} />
            </section>
            <section id="plan" className="scroll-mt-32 mt-6">
              <Plan input={input} cur={cur} levers={levers} off={off} setOff={setOff} aid={aid} setAid={setAid}
                heatingTarget={heatingTarget} setHeatingTarget={setHeatingTarget} tgt={tgt} netInvestment={netInvestment} />
            </section>
            <div className="mt-6" style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, flex: '1 1 300px' }}>
                <strong>Et ensuite ?</strong> Partagez ce diagnostic avec votre équipe : le lien contient toutes vos saisies, rien n'est stocké sur un serveur. Pour mesurer et piloter l'ensemble de vos émissions, découvrez Ecodex.
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={copyLink} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {copied ? '✓ Lien copié' : '🔗 Copier le lien de partage'}
                </button>
                <a href="https://getecodex.com" target="_blank" rel="noopener noreferrer" className="no-underline" style={{ padding: '8px 14px', borderRadius: 8, background: '#4856FF', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  Découvrir Ecodex →
                </a>
              </div>
            </div>
          </>
        ) : <Meth prices={input.prices} />}
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-2.5 pb-4 border-t border-gray-200">
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">Powered by</span>
          <a href="https://getecodex.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline">
            <EcodexLogo size={20} />
            <span className="text-[13px] font-extrabold" style={{ color: '#4856FF' }}>Ecodex</span>
          </a>
          <span className="text-[11px] text-gray-300">·</span>
          <a href="https://github.com/guicol57/electrification-score" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline text-[11px] text-gray-500 hover:text-gray-700">
            <GitHubLogo size={12} />
            Open source
          </a>
        </div>
      </div>
    </div>
  )
}
