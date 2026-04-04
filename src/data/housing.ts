/**
 * Housing energy data
 * Sources:
 *  - Emission factors: Base Carbone ADEME (France 2023) via Ecodex MCP
 *  - Costs: TCO complet (CAPEX amortissement + OPEX énergie/entretien), scénario prix hauts
 */

export interface HousingEquipment {
  id: string
  label: string
  /** kgCO2eq per kWh consumed */
  ef: number
  /** CAPEX: annualised investment cost per kWh (€/kWh) */
  capex: number
  /** OPEX: energy + maintenance cost per kWh (€/kWh) */
  opex: number
  fossil: boolean
  electric: boolean
  /** Equipment purchase cost (€) for investment delta calculation */
  equipCost: number
  /** kWh EP per kWh useful heat (EP_factor / COP). Used for target DPE computation. Only for heating/ECS. */
  epPerUseful?: number
}

export const HEATING: HousingEquipment[] = [
  { id: "gas_classic", label: "Chaudière gaz classique", ef: 0.227, capex: 0.02, opex: 0.16, fossil: true, electric: false, equipCost: 3500, epPerUseful: 1.18 },
  { id: "gas_low_temp", label: "Chaudière gaz basse temp.", ef: 0.227, capex: 0.02, opex: 0.15, fossil: true, electric: false, equipCost: 4500, epPerUseful: 1.09 },
  { id: "gas_condensing", label: "Chaudière gaz condensation", ef: 0.227, capex: 0.025, opex: 0.13, fossil: true, electric: false, equipCost: 6000, epPerUseful: 0.95 },
  { id: "oil_boiler", label: "Chaudière fioul", ef: 0.324, capex: 0.02, opex: 0.18, fossil: true, electric: false, equipCost: 6000, epPerUseful: 1.18 },
  { id: "wood_stove", label: "Poêle / Insert bois", ef: 0.03, capex: 0.03, opex: 0.07, fossil: false, electric: false, equipCost: 5000, epPerUseful: 1.0 },
  { id: "wood_boiler", label: "Chaudière granulés", ef: 0.03, capex: 0.04, opex: 0.07, fossil: false, electric: false, equipCost: 12000, epPerUseful: 1.0 },
  { id: "elec_rad", label: "Radiateur électrique", ef: 0.06, capex: 0.01, opex: 0.20, fossil: false, electric: true, equipCost: 2000, epPerUseful: 1.9 },
  { id: "heat_pump", label: "Pompe à chaleur (PAC)", ef: 0.06, capex: 0.12, opex: 0.20, fossil: false, electric: true, equipCost: 13000, epPerUseful: 0.633 },
  { id: "district", label: "Réseau de chaleur", ef: 0.11, capex: 0.01, opex: 0.09, fossil: false, electric: false, equipCost: 3000, epPerUseful: 1.0 },
]

export const HOT_WATER: HousingEquipment[] = [
  { id: "hw_gas", label: "Chauffe-eau gaz", ef: 0.227, capex: 0.01, opex: 0.16, fossil: true, electric: false, equipCost: 1500, epPerUseful: 1.0 },
  { id: "hw_oil", label: "Chauffe-eau fioul", ef: 0.324, capex: 0.01, opex: 0.18, fossil: true, electric: false, equipCost: 2000, epPerUseful: 1.0 },
  { id: "hw_elec", label: "Cumulus électrique", ef: 0.06, capex: 0.005, opex: 0.20, fossil: false, electric: true, equipCost: 800, epPerUseful: 1.9 },
  { id: "hw_thermo", label: "Chauffe-eau thermodynamique", ef: 0.06, capex: 0.08, opex: 0.20, fossil: false, electric: true, equipCost: 3500, epPerUseful: 0.633 },
  { id: "hw_solar", label: "Solaire thermique", ef: 0.005, capex: 0.04, opex: 0.01, fossil: false, electric: false, equipCost: 5000, epPerUseful: 0.1 },
]

export const COOKING: HousingEquipment[] = [
  { id: "cook_gas", label: "Gaz", ef: 0.227, capex: 0.005, opex: 0.16, fossil: true, electric: false, equipCost: 400 },
  { id: "cook_elec", label: "Plaques électriques", ef: 0.06, capex: 0.005, opex: 0.20, fossil: false, electric: true, equipCost: 300 },
  { id: "cook_induction", label: "Induction", ef: 0.06, capex: 0.01, opex: 0.20, fossil: false, electric: true, equipCost: 600 },
]

/**
 * Energy shares within DPE scope (chauffage + ECS only).
 * The DPE covers 5 uses: heating, hot water, cooling, lighting, auxiliaries.
 * Heating + ECS represent ~90% of DPE energy (cooling, lighting, auxiliaries ~10%).
 * Within that 90%, heating ≈ 77% and ECS ≈ 23% (from ADEME 67/20 ratio).
 */
export const DPE_USEFUL_SHARE = 0.90
export const ENERGY_SHARES = { heating: 0.77, hotWater: 0.23 } as const

/**
 * Cooking is NOT included in the DPE.
 * Average ~200 kWh/person/year (ADEME), weakly correlated with surface.
 * Formula: 200 + 2 × surface (m²) → ~420 kWh/year for a 110m² home.
 */
export function cookingKWh(areaM2: number): number {
  return 200 + 2 * areaM2
}

/**
 * DPE primary energy to final energy conversion factor.
 * DPE values are in kWh EP (primary energy). Our EFs are per kWh EF (final energy).
 * Source: https://rt-re-batiment.developpement-durable.gouv.fr (DPE 2026)
 * Gas/Oil/Wood = 1.0, Electricity = 1.9
 */
export const EP_TO_EF_ELEC = 1.9

/** DPE class to kWh EP/m².year median */
export const DPE_KWH: Record<string, number> = { A: 50, B: 100, C: 170, D: 230, E: 290, F: 370, G: 450 }

/** Map kWh EP/m² to DPE class using official thresholds */
export function epToDpe(epPerM2: number): string {
  if (epPerM2 <= 70) return "A"
  if (epPerM2 <= 110) return "B"
  if (epPerM2 <= 180) return "C"
  if (epPerM2 <= 250) return "D"
  if (epPerM2 <= 330) return "E"
  if (epPerM2 <= 420) return "F"
  return "G"
}

/** DPE class colors */
export const DPE_COLORS: Record<string, string> = {
  A: "#319834", B: "#33cc33", C: "#cbdb2a", D: "#ffff00",
  E: "#ffad00", F: "#f26522", G: "#e2001a",
}

/** DPE tooltip descriptions */
export const DPE_TIPS: Record<string, string> = {
  A: "≤70 kWh/m² · RE2020, très performant",
  B: "71-110 kWh/m² · Bien isolé",
  C: "111-180 kWh/m² · Correct, ~2000s",
  D: "181-250 kWh/m² · Moyen, ~1980-2000",
  E: "251-330 kWh/m² · Faible isolation",
  F: "331-420 kWh/m² · Passoire thermique",
  G: ">420 kWh/m² · Passoire sévère",
}

export const DPE_ORDER = ["A", "B", "C", "D", "E", "F", "G"] as const

/**
 * Renovation works with energy reduction and cost per m² of floor area.
 * Sources: Calculeo, Sonergia, ADEME (France 2024-2025)
 */
export interface RenovationWork {
  id: string
  label: string
  /** Fraction of heating energy saved (e.g. 0.25 for 25%) */
  reduction: number
  /** Cost per m² of floor area (€/m²) */
  costPerM2: number
}

export const RENOVATION_WORKS: RenovationWork[] = [
  { id: "toiture", label: "Isolation toiture / combles", reduction: 0.25, costPerM2: 40 },
  { id: "murs", label: "Isolation murs extérieurs", reduction: 0.20, costPerM2: 150 },
  { id: "plancher", label: "Isolation plancher bas", reduction: 0.07, costPerM2: 40 },
  { id: "fenetres", label: "Fenêtres double/triple vitrage", reduction: 0.10, costPerM2: 70 },
  { id: "vmc", label: "VMC double flux", reduction: 0.05, costPerM2: 45 },
]
