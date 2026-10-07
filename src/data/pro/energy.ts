/**
 * Energy carriers for the Entreprise simulator (final energy, prices excl. VAT).
 * Sources:
 *  - Emission factors (kgCO2eq/kWh final, combustion + upstream):
 *    gas, oil, electricity, district heating = same values as the Particulier housing data
 *    (Base Carbone ADEME via Ecodex MCP).
 *    Diesel: Base Carbone 2026 "Diesel - usage routier (gazole)" 3.48 kgCO2eq/L ÷ 10.0 kWh PCI/L.
 *    Petrol: Base Carbone 2026 "Essence E10 - usage routier" 2.84 kgCO2eq/L ÷ 8.9 kWh PCI/L.
 *  - Default prices: France averages, early October 2026, converted excl. VAT (TTC ÷ 1.2),
 *    editable in the UI:
 *    Diesel 2.363 €/L TTC, petrol SP95-E10 2.144 €/L TTC — prix-carburant.eu, 3 Oct 2026.
 *    Heating oil 1.827 €/L TTC — prixfioul.fr, 7 Oct 2026.
 *    Gas 0.14557 €/kWh TTC — CRE prix repère, profil chauffage, October 2026.
 *    Electricity 0.1624 €/kWh HTVA — EDF Tarif Bleu Pro option Base, October 2026 (Selectra).
 *    District heating 104.7 € HT/MWh — SNCU/SDES national average, 2024 (latest published).
 */

export type EnergyId = 'gas' | 'oil' | 'elec' | 'district' | 'diesel' | 'petrol'
export type EnergyKind = 'fossil' | 'electric' | 'other'

export interface Energy {
  id: EnergyId
  label: string
  /** kgCO2eq per kWh final */
  ef: number
  /** Default price, € HT per kWh final */
  price: number
  kind: EnergyKind
  /** Price unit shown to the user when it differs from €/kWh (e.g. €/L) */
  displayUnit?: { label: string; kwhPerUnit: number }
}

export const DIESEL_KWH_PER_L = 10.0
export const PETROL_KWH_PER_L = 8.9
export const OIL_KWH_PER_L = 10.0

const VAT = 1.2

export const ENERGIES: Record<EnergyId, Energy> = {
  gas: { id: 'gas', label: 'Gaz naturel', ef: 0.227, price: 0.14557 / VAT, kind: 'fossil' },
  oil: { id: 'oil', label: 'Fioul', ef: 0.324, price: 1.827 / VAT / OIL_KWH_PER_L, kind: 'fossil', displayUnit: { label: '€/L', kwhPerUnit: OIL_KWH_PER_L } },
  elec: { id: 'elec', label: 'Électricité', ef: 0.06, price: 0.1624, kind: 'electric' },
  district: { id: 'district', label: 'Réseau de chaleur', ef: 0.11, price: 0.1047, kind: 'other' },
  diesel: { id: 'diesel', label: 'Gazole', ef: 3.48 / DIESEL_KWH_PER_L, price: 2.363 / VAT / DIESEL_KWH_PER_L, kind: 'fossil', displayUnit: { label: '€/L', kwhPerUnit: DIESEL_KWH_PER_L } },
  petrol: { id: 'petrol', label: 'Essence', ef: 2.84 / PETROL_KWH_PER_L, price: 2.144 / VAT / PETROL_KWH_PER_L, kind: 'fossil', displayUnit: { label: '€/L', kwhPerUnit: PETROL_KWH_PER_L } },
}

export const ENERGY_IDS = Object.keys(ENERGIES) as EnergyId[]

export type EnergyPrices = Record<EnergyId, number>

export const DEFAULT_PRICES: EnergyPrices = Object.fromEntries(
  ENERGY_IDS.map(id => [id, ENERGIES[id].price])
) as EnergyPrices
