/**
 * Energy carriers for the Entreprise simulator (final energy, prices excl. VAT).
 * Sources:
 *  - Emission factors (kgCO2eq/kWh final, combustion + upstream):
 *    gas, oil, electricity, district heating = same values as the Particulier housing data
 *    (Base Carbone ADEME via Ecodex MCP).
 *    Diesel: Base Carbone 2026 "Diesel - usage routier (gazole)" 3.48 kgCO2eq/L ÷ 10.0 kWh PCI/L.
 *    Petrol: Base Carbone 2026 "Essence E10 - usage routier" 2.84 kgCO2eq/L ÷ 8.9 kWh PCI/L.
 *  - Prices: simulator assumptions, € HT 2026, editable in the UI.
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

export const ENERGIES: Record<EnergyId, Energy> = {
  gas: { id: 'gas', label: 'Gaz naturel', ef: 0.227, price: 0.09, kind: 'fossil' },
  oil: { id: 'oil', label: 'Fioul', ef: 0.324, price: 0.11, kind: 'fossil' },
  elec: { id: 'elec', label: 'Électricité', ef: 0.06, price: 0.18, kind: 'electric' },
  district: { id: 'district', label: 'Réseau de chaleur', ef: 0.11, price: 0.10, kind: 'other' },
  diesel: { id: 'diesel', label: 'Gazole', ef: 3.48 / DIESEL_KWH_PER_L, price: 1.45 / DIESEL_KWH_PER_L, kind: 'fossil', displayUnit: { label: '€/L', kwhPerUnit: DIESEL_KWH_PER_L } },
  petrol: { id: 'petrol', label: 'Essence', ef: 2.84 / PETROL_KWH_PER_L, price: 1.55 / PETROL_KWH_PER_L, kind: 'fossil', displayUnit: { label: '€/L', kwhPerUnit: PETROL_KWH_PER_L } },
}

export const ENERGY_IDS = Object.keys(ENERGIES) as EnergyId[]

export type EnergyPrices = Record<EnergyId, number>

export const DEFAULT_PRICES: EnergyPrices = Object.fromEntries(
  ENERGY_IDS.map(id => [id, ENERGIES[id].price])
) as EnergyPrices
