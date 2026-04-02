/**
 * Housing energy data
 * Sources:
 *  - Emission factors: PCAF (France 2023, Gate-to-gate) via Ecodex MCP
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
}

export const HEATING: HousingEquipment[] = [
  { id: "gas_boiler", label: "Chaudière gaz", ef: 0.227, capex: 0.02, opex: 0.16, fossil: true, electric: false, equipCost: 5000 },
  { id: "oil_boiler", label: "Chaudière fioul", ef: 0.324, capex: 0.02, opex: 0.18, fossil: true, electric: false, equipCost: 6000 },
  { id: "wood_stove", label: "Poêle / Insert bois", ef: 0.03, capex: 0.03, opex: 0.07, fossil: false, electric: false, equipCost: 5000 },
  { id: "wood_boiler", label: "Chaudière granulés", ef: 0.03, capex: 0.04, opex: 0.07, fossil: false, electric: false, equipCost: 12000 },
  { id: "elec_rad", label: "Radiateur électrique", ef: 0.06, capex: 0.01, opex: 0.20, fossil: false, electric: true, equipCost: 2000 },
  { id: "heat_pump", label: "Pompe à chaleur (PAC)", ef: 0.02, capex: 0.05, opex: 0.07, fossil: false, electric: true, equipCost: 13000 },
  { id: "district", label: "Réseau de chaleur", ef: 0.11, capex: 0.01, opex: 0.09, fossil: false, electric: false, equipCost: 3000 },
]

export const HOT_WATER: HousingEquipment[] = [
  { id: "hw_gas", label: "Chauffe-eau gaz", ef: 0.227, capex: 0.01, opex: 0.16, fossil: true, electric: false, equipCost: 1500 },
  { id: "hw_oil", label: "Chauffe-eau fioul", ef: 0.324, capex: 0.01, opex: 0.18, fossil: true, electric: false, equipCost: 2000 },
  { id: "hw_elec", label: "Cumulus électrique", ef: 0.06, capex: 0.005, opex: 0.20, fossil: false, electric: true, equipCost: 800 },
  { id: "hw_thermo", label: "Chauffe-eau thermodynamique", ef: 0.02, capex: 0.03, opex: 0.07, fossil: false, electric: true, equipCost: 3500 },
  { id: "hw_solar", label: "Solaire thermique", ef: 0.005, capex: 0.04, opex: 0.01, fossil: false, electric: false, equipCost: 5000 },
]

export const COOKING: HousingEquipment[] = [
  { id: "cook_gas", label: "Gaz", ef: 0.227, capex: 0.005, opex: 0.16, fossil: true, electric: false, equipCost: 400 },
  { id: "cook_elec", label: "Plaques électriques", ef: 0.06, capex: 0.005, opex: 0.20, fossil: false, electric: true, equipCost: 300 },
  { id: "cook_induction", label: "Induction", ef: 0.06, capex: 0.01, opex: 0.20, fossil: false, electric: true, equipCost: 600 },
]

/** Energy share per housing usage (ADEME average) */
export const ENERGY_SHARES = { heating: 0.67, hotWater: 0.20, cooking: 0.13 } as const

/** DPE class to kWh/m².year median */
export const DPE_KWH: Record<string, number> = { A: 50, B: 100, C: 170, D: 230, E: 290, F: 370, G: 450 }

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

/** Renovation cost per m² by number of DPE classes gained */
export const RENOVATION_COST_PER_CLASS: Record<number, number> = {
  1: 150, 2: 250, 3: 400, 4: 550, 5: 650, 6: 700,
}
