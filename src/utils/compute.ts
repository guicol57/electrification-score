import { HEATING, HOT_WATER, COOKING, ENERGY_SHARES, DPE_USEFUL_SHARE, EP_TO_EF_ELEC, DPE_KWH, DPE_ORDER, RENOVATION_COST_PER_CLASS, cookingKWh } from '../data/housing'
import { TRANSPORT_MODES } from '../data/transport'
import type { HousingEquipment } from '../data/housing'
import type { TransportMode } from '../data/transport'

// ---- Types ----

export interface TransportEntry {
  mode: string
  km: number
  label: string
  occ: number
}

export interface Scenario {
  area: number
  dpe: string
  heating: string
  hotWater: string
  cooking: string
  transports: TransportEntry[]
}

export interface ScoreGrade {
  g: string
  c: string
  t: string
}

export interface TransportDetail extends TransportEntry {
  co2: number
  cost: number
  modeName: string
}

export interface AnnualResult {
  heatingCO2: number
  hwCO2: number
  cookCO2: number
  heatingCost: number
  hwCost: number
  cookCost: number
  totalCO2: number
  totalCost: number
  transportDetails: TransportDetail[]
  fossilPct: number
  electricPct: number
  fossilScore: ScoreGrade
  elecScore: ScoreGrade
}

export interface InvestmentResult {
  renoCost: number
  renoPerM2: number
  dpeJump: number
  heatingDelta: number
  hwDelta: number
  cookDelta: number
  vehicleDelta: number
  totalInvestment: number
}

// ---- Helpers ----

export function getElecScore(pct: number): ScoreGrade {
  if (pct >= 80) return { g: "A", c: "#319834", t: "Excellent" }
  if (pct >= 60) return { g: "B", c: "#33cc33", t: "Bon" }
  if (pct >= 40) return { g: "C", c: "#cbdb2a", t: "Moyen" }
  if (pct >= 20) return { g: "D", c: "#ffad00", t: "Faible" }
  return { g: "E", c: "#e2001a", t: "Très faible" }
}

export function getFossilScore(pct: number): ScoreGrade {
  if (pct <= 10) return { g: "A", c: "#319834", t: "Très faible" }
  if (pct <= 30) return { g: "B", c: "#33cc33", t: "Faible" }
  if (pct <= 50) return { g: "C", c: "#cbdb2a", t: "Moyenne" }
  if (pct <= 75) return { g: "D", c: "#ffad00", t: "Élevée" }
  return { g: "E", c: "#e2001a", t: "Très élevée" }
}

export function roundTen(v: number): number {
  return Math.round(v / 10) * 10
}

// ---- Core computation ----

export function computeAnnual(sc: Scenario): AnnualResult {
  const kwh = DPE_KWH[sc.dpe] || 230
  const ht = HEATING.find(t => t.id === sc.heating) || HEATING[0]
  const hw = HOT_WATER.find(t => t.id === sc.hotWater) || HOT_WATER[0]
  const ck = COOKING.find(t => t.id === sc.cooking) || COOKING[0]

  // DPE values are in kWh EP (primary energy). Convert to final energy.
  // Gas/Oil/Wood: EP factor = 1 → no conversion. Electricity: EP factor = 1.9.
  const dpeEP = kwh * sc.area * DPE_USEFUL_SHARE
  const hEP = dpeEP * ENERGY_SHARES.heating
  const wEP = dpeEP * ENERGY_SHARES.hotWater
  const hK = hEP / (ht.electric ? EP_TO_EF_ELEC : 1)
  const wK = wEP / (hw.electric ? EP_TO_EF_ELEC : 1)
  // Cooking is NOT in the DPE — estimated separately (already in final energy)
  const cK = cookingKWh(sc.area)

  const heatingCO2 = hK * ht.ef
  const hwCO2 = wK * hw.ef
  const cookCO2 = cK * ck.ef
  const heatingCost = hK * (ht.capex + ht.opex)
  const hwCost = wK * (hw.capex + hw.opex)
  const cookCost = cK * (ck.capex + ck.opex)

  let fossilEnergy = 0, electricEnergy = 0, totalEnergy = hK + wK + cK
  if (ht.fossil) fossilEnergy += hK; if (ht.electric) electricEnergy += hK
  if (hw.fossil) fossilEnergy += wK; if (hw.electric) electricEnergy += wK
  if (ck.fossil) fossilEnergy += cK; if (ck.electric) electricEnergy += cK

  let transportCO2 = 0, transportCost = 0
  const transportDetails: TransportDetail[] = sc.transports.map(t => {
    const m = TRANSPORT_MODES.find(x => x.id === t.mode) || TRANSPORT_MODES[0]
    const occ = (m.perVehicle && t.occ > 1) ? t.occ : 1
    const co2 = t.km * m.ef / occ
    const cost = t.km * ((m.capex / Math.max(occ, 1)) + m.opex)
    const energy = t.km * (m.fossil ? 0.6 : m.electric ? 0.2 : 0.05)
    if (m.fossil) fossilEnergy += energy
    if (m.electric) electricEnergy += energy
    totalEnergy += energy
    transportCO2 += co2
    transportCost += cost
    return { ...t, co2, cost, modeName: m.label }
  })

  const totalCO2 = heatingCO2 + hwCO2 + cookCO2 + transportCO2
  const totalCost = heatingCost + hwCost + cookCost + transportCost
  const fossilPct = totalEnergy > 0 ? (fossilEnergy / totalEnergy) * 100 : 0
  const electricPct = totalEnergy > 0 ? (electricEnergy / totalEnergy) * 100 : 0

  return {
    heatingCO2, hwCO2, cookCO2,
    heatingCost, hwCost, cookCost,
    totalCO2, totalCost,
    transportDetails,
    fossilPct, electricPct,
    fossilScore: getFossilScore(fossilPct),
    elecScore: getElecScore(electricPct),
  }
}

export function computeInvestment(curSc: Scenario, tgtSc: Scenario): InvestmentResult {
  const curIdx = DPE_ORDER.indexOf(curSc.dpe as typeof DPE_ORDER[number])
  const tgtIdx = DPE_ORDER.indexOf(tgtSc.dpe as typeof DPE_ORDER[number])
  const dpeJump = Math.max(0, curIdx - tgtIdx)
  const renoPerM2 = dpeJump > 0 ? (RENOVATION_COST_PER_CLASS[Math.min(dpeJump, 6)] || 700) : 0
  const renoCost = renoPerM2 * tgtSc.area

  const findH = (id: string) => HEATING.find(t => t.id === id)
  const findW = (id: string) => HOT_WATER.find(t => t.id === id)
  const findC = (id: string) => COOKING.find(t => t.id === id)

  const heatingDelta = curSc.heating !== tgtSc.heating
    ? Math.max(0, (findH(tgtSc.heating)?.equipCost || 0) - (findH(curSc.heating)?.equipCost || 0) * 0.3)
    : 0
  const hwDelta = curSc.hotWater !== tgtSc.hotWater
    ? Math.max(0, (findW(tgtSc.hotWater)?.equipCost || 0) - (findW(curSc.hotWater)?.equipCost || 0) * 0.3)
    : 0
  const cookDelta = curSc.cooking !== tgtSc.cooking
    ? Math.max(0, (findC(tgtSc.cooking)?.equipCost || 0) - (findC(curSc.cooking)?.equipCost || 0) * 0.3)
    : 0

  const curVehicles = curSc.transports.filter(t => (TRANSPORT_MODES.find(x => x.id === t.mode)?.vehicleCost || 0) > 0)
  const tgtVehicles = tgtSc.transports.filter(t => (TRANSPORT_MODES.find(x => x.id === t.mode)?.vehicleCost || 0) > 0)
  let vehicleDelta = 0
  tgtVehicles.forEach((v, i) => {
    const tm = TRANSPORT_MODES.find(x => x.id === v.mode)
    const cm = i < curVehicles.length ? TRANSPORT_MODES.find(x => x.id === curVehicles[i].mode) : null
    vehicleDelta += Math.max(0, (tm?.vehicleCost || 0) - (cm?.vehicleCost || 0))
  })

  return {
    renoCost, renoPerM2, dpeJump,
    heatingDelta, hwDelta, cookDelta, vehicleDelta,
    totalInvestment: renoCost + heatingDelta + hwDelta + cookDelta + vehicleDelta,
  }
}
