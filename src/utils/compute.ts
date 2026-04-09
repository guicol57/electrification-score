import { HEATING, HOT_WATER, COOKING, ENERGY_SHARES, DPE_USEFUL_SHARE, EP_TO_EF_ELEC, DPE_KWH, DPE_ORDER, RENOVATION_WORKS, epToDpe, cookingKWh } from '../data/housing'
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
  renovations?: string[]
  /** Exact EP/m² (when computed from target DPE). Overrides DPE_KWH lookup. */
  epPerM2?: number
  /** Per-usage EP/m² breakdown (heating vs ECS computed independently) */
  heatingEpPerM2?: number
  hwEpPerM2?: number
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
  vehicleCost: number
  vehicleReprise: number
  vehicleNet: number
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

// ---- Target DPE computation ----

export function computeTargetDPE(
  curDpe: string, curHeating: string, curHotWater: string,
  tgtHeating: string, tgtHotWater: string, renovations: string[]
): { epPerM2: number; dpe: string; heatingEpPerM2: number; hwEpPerM2: number } {
  const curEP = DPE_KWH[curDpe] || 230

  // 1. Insulation reduction factor (multiplicative)
  const insulationFactor = RENOVATION_WORKS
    .filter(w => renovations.includes(w.id))
    .reduce((acc, w) => acc * (1 - w.reduction), 1.0)

  // 2. Per-usage EP computation (each usage adjusted independently)
  const curHt = HEATING.find(h => h.id === curHeating)
  const curHw = HOT_WATER.find(h => h.id === curHotWater)
  const tgtHt = HEATING.find(h => h.id === tgtHeating)
  const tgtHw = HOT_WATER.find(h => h.id === tgtHotWater)

  const curHeatingEP = curEP * DPE_USEFUL_SHARE * ENERGY_SHARES.heating
  const curHwEP = curEP * DPE_USEFUL_SHARE * ENERGY_SHARES.hotWater

  // Each usage: insulation reduction + its OWN equipment ratio
  const htRatio = (curHt?.epPerUseful ?? 1) > 0 ? (tgtHt?.epPerUseful ?? 1) / (curHt?.epPerUseful ?? 1) : 1
  const hwRatio = (curHw?.epPerUseful ?? 1) > 0 ? (tgtHw?.epPerUseful ?? 1) / (curHw?.epPerUseful ?? 1) : 1

  const heatingEpPerM2 = curHeatingEP * insulationFactor * htRatio
  const hwEpPerM2 = curHwEP * insulationFactor * hwRatio
  const otherEP = curEP * (1 - DPE_USEFUL_SHARE)
  const epPerM2 = Math.round(heatingEpPerM2 + hwEpPerM2 + otherEP)

  return { epPerM2, dpe: epToDpe(epPerM2), heatingEpPerM2, hwEpPerM2 }
}

// ---- Core computation ----

export function computeAnnual(sc: Scenario): AnnualResult {
  const ht = HEATING.find(t => t.id === sc.heating) || HEATING[0]
  const hw = HOT_WATER.find(t => t.id === sc.hotWater) || HOT_WATER[0]
  const ck = COOKING.find(t => t.id === sc.cooking) || COOKING[0]

  // Use per-usage EP if available (target scenario), otherwise derive from DPE median
  let hEP: number, wEP: number
  if (sc.heatingEpPerM2 !== undefined && sc.hwEpPerM2 !== undefined) {
    // Target scenario: each usage computed independently (no cross-contamination)
    hEP = sc.heatingEpPerM2 * sc.area
    wEP = sc.hwEpPerM2 * sc.area
  } else {
    // Current scenario: derive from DPE median
    const kwh = DPE_KWH[sc.dpe] || 230
    const dpeEP = kwh * sc.area * DPE_USEFUL_SHARE
    hEP = dpeEP * ENERGY_SHARES.heating
    wEP = dpeEP * ENERGY_SHARES.hotWater
  }

  // Convert EP to final energy. Gas/Oil/Wood: ÷1. Electricity: ÷1.9.
  const hK = hEP / (ht.electric ? EP_TO_EF_ELEC : 1)
  const wK = wEP / (hw.electric ? EP_TO_EF_ELEC : 1)
  // Cooking is NOT in the DPE — estimated separately (already in final energy)
  const cK = cookingKWh(sc.area)

  const heatingCO2 = hK * ht.ef
  const hwCO2 = wK * hw.ef
  const cookCO2 = cK * ck.ef
  const heatingCost = hK * ht.opex
  const hwCost = wK * hw.opex
  const cookCost = cK * ck.opex

  let fossilEnergy = 0, electricEnergy = 0, totalEnergy = hK + wK + cK
  if (ht.fossil) fossilEnergy += hK; if (ht.electric) electricEnergy += hK
  if (hw.fossil) fossilEnergy += wK; if (hw.electric) electricEnergy += wK
  if (ck.fossil) fossilEnergy += cK; if (ck.electric) electricEnergy += cK

  let transportCO2 = 0, transportCost = 0
  const transportDetails: TransportDetail[] = sc.transports.map(t => {
    const m = TRANSPORT_MODES.find(x => x.id === t.mode) || TRANSPORT_MODES[0]
    const occ = (m.perVehicle && t.occ > 1) ? t.occ : 1
    const co2 = t.km * m.ef / occ
    const cost = t.km * m.opex
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
  // Renovation cost from selected works
  const selectedWorks = RENOVATION_WORKS.filter(w => (tgtSc.renovations || []).includes(w.id))
  const renoPerM2 = selectedWorks.reduce((sum, w) => sum + w.costPerM2, 0)
  const renoCost = renoPerM2 * tgtSc.area

  const curIdx = DPE_ORDER.indexOf(curSc.dpe as typeof DPE_ORDER[number])
  const tgtIdx = DPE_ORDER.indexOf(tgtSc.dpe as typeof DPE_ORDER[number])
  const dpeJump = Math.max(0, curIdx - tgtIdx)

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

  // Vehicles: total cost of target vehicles - reprise (30% residual value of current vehicles)
  const vehicleCost = tgtSc.transports.reduce((sum, t) => {
    const m = TRANSPORT_MODES.find(x => x.id === t.mode)
    return sum + (m?.vehicleCost || 0)
  }, 0)
  const vehicleReprise = curSc.transports.reduce((sum, t) => {
    const m = TRANSPORT_MODES.find(x => x.id === t.mode)
    return sum + (m?.vehicleCost || 0) * 0.3
  }, 0)
  const vehicleNet = Math.max(0, vehicleCost - vehicleReprise)

  return {
    renoCost, renoPerM2, dpeJump,
    heatingDelta, hwDelta, cookDelta,
    vehicleCost, vehicleReprise, vehicleNet,
    totalInvestment: renoCost + heatingDelta + hwDelta + cookDelta + vehicleNet,
  }
}
