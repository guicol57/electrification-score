import {
  ENERGIES, PRO_HEATING, PRO_HOT_WATER, FLEET_CATEGORIES, SECTORS, COMMUTE_MODES,
  HEATING_W_PER_M2, CHARGER_COST, DIESEL_KWH_PER_L, PETROL_KWH_PER_L, heatingTargetFor, HEAT_PUMP_IDS,
} from '../data/pro'
import type { EnergyId, EnergyKind, EnergyPrices, FleetLine, Sector } from '../data/pro'
import { TRANSPORT_MODES } from '../data/transport'
import { getElecScore, getFossilScore, type ScoreGrade } from './score'

// ---- Types ----

export interface TravelEntry {
  mode: string
  /** passenger.km per year */
  km: number
}

export interface CommuteInput {
  /** One-way distance, km */
  kmOneWay: number
  /** Days on site per employee per year */
  days: number
  /** % of employees per COMMUTE_MODES id */
  shares: Record<string, number>
}

export interface ProInput {
  sectorId: string
  area: number
  staff: number
  /** 'ratio' = sector ratios × area, 'real' = annual consumption entered by the user */
  buildingMode: 'ratio' | 'real'
  /** Real mode: final kWh/year of the CURRENT heating system */
  realHeatingKwh: number
  /** Real mode: final kWh/year of the CURRENT hot water system */
  realHotWaterKwh: number
  /** Real mode: electricity kWh/year for cooling + lighting */
  realElecOtherKwh: number
  heating: string
  hotWater: string
  fleet: FleetLine[]
  travel: TravelEntry[]
  commute: CommuteInput
  prices: EnergyPrices
}

/** What changes between current and target: equipment and vehicles */
export interface ProScenario {
  heating: string
  hotWater: string
  fleet: FleetLine[]
}

export interface Needs {
  /** Useful heating need, kWh/year */
  heating: number
  /** Useful hot water need, kWh/year */
  hotWater: number
  /** Cooling + lighting electricity, kWh/year */
  elecOther: number
}

export interface UsageLine {
  id: string
  family: 'building' | 'fleet'
  label: string
  /** Final energy by carrier, kWh/year */
  kwh: Partial<Record<EnergyId, number>>
  /** kgCO2eq/year */
  co2: number
  /** € HT/year (energy + maintenance) */
  cost: number
}

export interface ProAnnualResult {
  lines: UsageLine[]
  totalKwh: number
  electricPct: number
  fossilPct: number
  elecScore: ScoreGrade
  fossilScore: ScoreGrade
  buildingElecPct: number
  fleetElecPct: number
  buildingKwh: number
  fleetKwh: number
  /** kgCO2eq/year */
  totalCO2: number
  /** € HT/year */
  totalCost: number
  /** € HT/year split by energy kind (maintenance counted as 'other') */
  costByKind: Record<EnergyKind, number>
}

export interface MobilityResult {
  travelCO2: number
  commuteCO2: number
  totalKm: number
  /** Share of passenger.km in electric or active modes, % */
  nonFossilKmPct: number
  nonFossilScore: ScoreGrade
}

export interface LeverDef {
  id: string
  family: 'building' | 'fleet'
  label: string
  detail: string
  /** Gross investment, € HT */
  investment: number
  defaultAidPct: number
  apply: (sc: ProScenario) => ProScenario
}

export interface LeverResult extends LeverDef {
  aidPct: number
  netInvestment: number
  /** € HT/year, year 1 */
  annualSavings: number
  /** kgCO2eq/year */
  co2Avoided: number
  /** years, Infinity when no savings */
  payback: number
  electricPctAfter: number
}

// ---- Lookups ----

export const sectorById = (id: string): Sector => SECTORS.find(s => s.id === id) || SECTORS[0]
const heatingById = (id: string) => PRO_HEATING.find(h => h.id === id) || PRO_HEATING[0]
const hotWaterById = (id: string) => PRO_HOT_WATER.find(h => h.id === id) || PRO_HOT_WATER[0]
const fleetById = (id: string) => FLEET_CATEGORIES.find(c => c.id === id) || FLEET_CATEGORIES[0]

export function heatingPowerKw(area: number): number {
  return area * HEATING_W_PER_M2 / 1000
}

// ---- Needs ----

/** Useful needs are a property of the site: they do not change when equipment changes. */
export function computeNeeds(input: ProInput): Needs {
  if (input.buildingMode === 'real') {
    return {
      heating: input.realHeatingKwh * heatingById(input.heating).efficiency,
      hotWater: input.realHotWaterKwh * hotWaterById(input.hotWater).efficiency,
      elecOther: input.realElecOtherKwh,
    }
  }
  const r = sectorById(input.sectorId).ratios
  return {
    heating: r.heatingNeed * input.area,
    hotWater: r.hotWaterNeed * input.area,
    elecOther: (r.cooling + r.lighting) * input.area,
  }
}

// ---- Annual computation ----

function lineFor(id: string, family: UsageLine['family'], label: string, kwh: Partial<Record<EnergyId, number>>, extraCO2: number, extraCost: number, prices: EnergyPrices): UsageLine {
  let co2 = extraCO2, cost = extraCost
  for (const [e, v] of Object.entries(kwh) as [EnergyId, number][]) {
    co2 += v * ENERGIES[e].ef
    cost += v * prices[e]
  }
  return { id, family, label, kwh, co2, cost }
}

function fleetLine(l: FleetLine, i: number, prices: EnergyPrices): UsageLine {
  const c = fleetById(l.category)
  const km = l.count * l.kmPerVehicle
  const kwh: Partial<Record<EnergyId, number>> = {}
  if (c.fuel && c.fuelL100 > 0) {
    kwh[c.fuel] = km * c.fuelL100 / 100 * (c.fuel === 'diesel' ? DIESEL_KWH_PER_L : PETROL_KWH_PER_L)
  }
  if (c.elecKwh100 > 0) kwh.elec = km * c.elecKwh100 / 100
  return lineFor(`fleet-${i}`, 'fleet', `${l.count} × ${c.label}`, kwh, km * c.mfgPerKm, km * c.maintPerKm, prices)
}

export function computeProAnnual(input: ProInput, needs: Needs, sc: ProScenario): ProAnnualResult {
  const { prices } = input
  const ht = heatingById(sc.heating)
  const hw = hotWaterById(sc.hotWater)

  const lines: UsageLine[] = [
    lineFor('heating', 'building', `Chauffage · ${ht.label}`, { [ht.energy]: needs.heating / ht.efficiency }, 0, heatingPowerKw(input.area) * ht.maintPerKw, prices),
    lineFor('hotWater', 'building', `Eau chaude · ${hw.label}`, { [hw.energy]: needs.hotWater / hw.efficiency }, 0, 0, prices),
    lineFor('elecOther', 'building', 'Climatisation, éclairage', { elec: needs.elecOther }, 0, 0, prices),
    ...sc.fleet.filter(l => l.count > 0 && l.kmPerVehicle > 0).map((l, i) => fleetLine(l, i, prices)),
  ]

  const sumBy = (family: UsageLine['family'] | null, kind: EnergyKind | null) => lines
    .filter(l => !family || l.family === family)
    .reduce((s, l) => s + (Object.entries(l.kwh) as [EnergyId, number][])
      .filter(([e]) => !kind || ENERGIES[e].kind === kind)
      .reduce((a, [, v]) => a + v, 0), 0)

  const totalKwh = sumBy(null, null)
  const elecKwh = sumBy(null, 'electric')
  const fossilKwh = sumBy(null, 'fossil')
  const buildingKwh = sumBy('building', null)
  const fleetKwh = sumBy('fleet', null)
  const pct = (a: number, b: number) => b > 0 ? a / b * 100 : 0
  const electricPct = pct(elecKwh, totalKwh)
  const fossilPct = pct(fossilKwh, totalKwh)

  const costByKind: Record<EnergyKind, number> = { fossil: 0, electric: 0, other: 0 }
  let totalCost = 0
  for (const l of lines) {
    let energyCost = 0
    for (const [e, v] of Object.entries(l.kwh) as [EnergyId, number][]) {
      costByKind[ENERGIES[e].kind] += v * prices[e]
      energyCost += v * prices[e]
    }
    costByKind.other += l.cost - energyCost
    totalCost += l.cost
  }

  return {
    lines, totalKwh, electricPct, fossilPct,
    elecScore: getElecScore(electricPct),
    fossilScore: getFossilScore(fossilPct),
    buildingElecPct: pct(sumBy('building', 'electric'), buildingKwh),
    fleetElecPct: pct(sumBy('fleet', 'electric'), fleetKwh),
    buildingKwh, fleetKwh,
    totalCO2: lines.reduce((s, l) => s + l.co2, 0),
    totalCost, costByKind,
  }
}

// ---- Employee mobility (shown separately, not in the main score) ----

/** Electric share of a transport mode's km: PHEVs count half, active modes count as non-fossil. */
function nonFossilShare(modeId: string): number {
  const m = TRANSPORT_MODES.find(x => x.id === modeId)
  if (!m) return 0
  if (m.fossil && m.electric) return 0.5
  return m.fossil ? 0 : 1
}

export function computeMobility(input: ProInput): MobilityResult {
  const efOf = (id: string) => TRANSPORT_MODES.find(x => x.id === id)?.ef ?? 0
  let totalKm = 0, nonFossilKm = 0

  let travelCO2 = 0
  for (const t of input.travel) {
    travelCO2 += t.km * efOf(t.mode)
    totalKm += t.km
    nonFossilKm += t.km * nonFossilShare(t.mode)
  }

  let commuteCO2 = 0
  const kmPerEmployee = input.commute.kmOneWay * 2 * input.commute.days
  for (const cm of COMMUTE_MODES) {
    if (!cm.mode) continue
    const km = input.staff * (input.commute.shares[cm.id] ?? 0) / 100 * kmPerEmployee
    commuteCO2 += km * efOf(cm.mode)
    totalKm += km
    nonFossilKm += km * nonFossilShare(cm.mode)
  }

  const nonFossilKmPct = totalKm > 0 ? nonFossilKm / totalKm * 100 : 0
  return { travelCO2, commuteCO2, totalKm, nonFossilKmPct, nonFossilScore: getElecScore(nonFossilKmPct) }
}

// ---- Benchmark ----

export interface Benchmark {
  /** Final kWh/m²/year of the user's building */
  userKwhPerM2: number
  /** Final kWh/m²/year of the sector reference (sector ratios + sector default equipment) */
  refKwhPerM2: number
  userElecPct: number
  refElecPct: number
}

export function computeBenchmark(input: ProInput, current: ProAnnualResult): Benchmark {
  const s = sectorById(input.sectorId)
  const refInput: ProInput = { ...input, buildingMode: 'ratio', heating: s.defaults.heating, hotWater: s.defaults.hotWater }
  const ref = computeProAnnual(refInput, computeNeeds(refInput), { heating: s.defaults.heating, hotWater: s.defaults.hotWater, fleet: [] })
  const perM2 = (kwh: number) => input.area > 0 ? kwh / input.area : 0
  return {
    userKwhPerM2: perM2(current.buildingKwh),
    refKwhPerM2: perM2(ref.buildingKwh),
    userElecPct: current.buildingElecPct,
    refElecPct: ref.buildingElecPct,
  }
}

// ---- Action plan ----

/** Residual value credited for the equipment being replaced (same convention as Particulier) */
const RESIDUAL = 0.3

export function buildLevers(input: ProInput, needs: Needs, current: ProScenario, heatingTarget?: string): LeverDef[] {
  const levers: LeverDef[] = []
  const power = heatingPowerKw(input.area)

  const curHt = PRO_HEATING.find(h => h.id === current.heating)
  if (curHt && !HEAT_PUMP_IDS.includes(curHt.id)) {
    const tgt = heatingById(heatingTarget || heatingTargetFor(curHt.id))
    levers.push({
      id: 'heating', family: 'building',
      label: `Chauffage : ${curHt.label} → ${tgt.label}`,
      detail: `${Math.round(power)} kW installés`,
      investment: Math.max(0, power * tgt.costPerKw - RESIDUAL * power * curHt.costPerKw),
      defaultAidPct: 20,
      apply: sc => ({ ...sc, heating: tgt.id }),
    })
  }

  const curHw = PRO_HOT_WATER.find(h => h.id === current.hotWater)
  if (curHw && curHw.id !== 'dhw_thermo') {
    const tgt = hotWaterById('dhw_thermo')
    levers.push({
      id: 'hotWater', family: 'building',
      label: `Eau chaude : ${curHw.label} → ${tgt.label}`,
      detail: `${Math.round(needs.hotWater).toLocaleString('fr-FR')} kWh utiles/an`,
      investment: Math.max(0, needs.hotWater * (tgt.costPerAnnualKwh - RESIDUAL * curHw.costPerAnnualKwh)),
      defaultAidPct: 20,
      apply: sc => ({ ...sc, hotWater: tgt.id }),
    })
  }

  current.fleet.forEach((l, i) => {
    const c = FLEET_CATEGORIES.find(x => x.id === l.category)
    if (!c || !c.electricTarget || l.count <= 0) return
    const tgt = fleetById(c.electricTarget)
    levers.push({
      id: `fleet-${i}`, family: 'fleet',
      label: `Flotte : ${l.count} × ${c.label} → ${tgt.label}`,
      detail: `au renouvellement, + ${l.count} point${l.count > 1 ? 's' : ''} de charge`,
      investment: l.count * (Math.max(0, tgt.price - c.price) + CHARGER_COST),
      defaultAidPct: 0,
      apply: sc => ({ ...sc, fleet: sc.fleet.map((x, j) => j === i ? { ...x, category: tgt.id } : x) }),
    })
  })

  return levers
}

export function evaluateLevers(input: ProInput, needs: Needs, current: ProScenario, levers: LeverDef[], aidPct: Record<string, number>): LeverResult[] {
  const base = computeProAnnual(input, needs, current)
  return levers.map(l => {
    const after = computeProAnnual(input, needs, l.apply(current))
    const pct = aidPct[l.id] ?? l.defaultAidPct
    const netInvestment = l.investment * (1 - pct / 100)
    const annualSavings = base.totalCost - after.totalCost
    return {
      ...l,
      aidPct: pct,
      netInvestment,
      annualSavings,
      co2Avoided: base.totalCO2 - after.totalCO2,
      payback: annualSavings > 0 ? netInvestment / annualSavings : Infinity,
      electricPctAfter: after.electricPct,
    }
  }).sort((a, b) => a.payback - b.payback)
}

export function applyLevers(current: ProScenario, levers: LeverDef[], selected: string[]): ProScenario {
  return levers.filter(l => selected.includes(l.id)).reduce((sc, l) => l.apply(sc), current)
}

/** Per-km emissions and running cost of a fleet category (methodology table) */
export function fleetCategoryPerKm(categoryId: string, prices: EnergyPrices): { co2: number; cost: number } {
  const l = fleetLine({ category: categoryId, count: 1, kmPerVehicle: 1 }, 0, prices)
  return { co2: l.co2, cost: l.cost }
}

// ---- Multi-year cumulative costs ----

export interface CumulPoint { year: number; actuel: number; cible: number }

export function cumulativeCosts(cur: ProAnnualResult, tgt: ProAnnualResult, netInvestment: number, years: number, fossilInfl: number, elecInfl: number): CumulPoint[] {
  const yearCost = (r: ProAnnualResult, y: number) =>
    r.costByKind.fossil * Math.pow(1 + fossilInfl / 100, y - 1)
    + r.costByKind.electric * Math.pow(1 + elecInfl / 100, y - 1)
    + r.costByKind.other * Math.pow(1.02, y - 1)
  const pts: CumulPoint[] = [{ year: 0, actuel: 0, cible: netInvestment }]
  let c = 0, t = netInvestment
  for (let y = 1; y <= years; y++) {
    c += yearCost(cur, y)
    t += yearCost(tgt, y)
    pts.push({ year: y, actuel: c, cible: t })
  }
  return pts
}
