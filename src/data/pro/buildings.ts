/**
 * Tertiary building equipment for the Entreprise simulator.
 * Sources / assumptions (€ HT, France 2026, indicative orders of magnitude):
 *  - Efficiencies: seasonal efficiency of combustion systems, SCOP of heat pumps.
 *  - Installed costs per kW and maintenance per kW/year: simulator assumptions.
 *  - Heating power sized at HEATING_W_PER_M2 (typical tertiary range 50-100 W/m²).
 */
import type { EnergyId } from './energy'

export interface HeatingSystem {
  id: string
  label: string
  energy: EnergyId
  /** Useful heat produced per kWh final (efficiency or SCOP) */
  efficiency: number
  /** Installed cost, € HT per kW */
  costPerKw: number
  /** Maintenance, € HT per kW per year */
  maintPerKw: number
}

export const HEATING_W_PER_M2 = 70

export const PRO_HEATING: HeatingSystem[] = [
  { id: 'gas_boiler', label: 'Chaudière gaz', energy: 'gas', efficiency: 0.92, costPerKw: 250, maintPerKw: 6 },
  { id: 'gas_radiant', label: 'Aérothermes / tubes radiants gaz', energy: 'gas', efficiency: 0.85, costPerKw: 120, maintPerKw: 4 },
  { id: 'oil_boiler', label: 'Chaudière fioul', energy: 'oil', efficiency: 0.85, costPerKw: 300, maintPerKw: 8 },
  { id: 'elec_joule', label: 'Convecteurs électriques', energy: 'elec', efficiency: 1.0, costPerKw: 150, maintPerKw: 1 },
  { id: 'hp_air_water', label: 'PAC air/eau', energy: 'elec', efficiency: 2.8, costPerKw: 900, maintPerKw: 10 },
  { id: 'hp_air_air', label: 'PAC air/air (split, VRV, rooftop)', energy: 'elec', efficiency: 3.2, costPerKw: 700, maintPerKw: 10 },
  { id: 'district', label: 'Réseau de chaleur', energy: 'district', efficiency: 1.0, costPerKw: 150, maintPerKw: 3 },
]

export interface HotWaterSystem {
  id: string
  label: string
  energy: EnergyId
  efficiency: number
  /** Installed cost, € HT per kWh of annual useful need */
  costPerAnnualKwh: number
}

export const PRO_HOT_WATER: HotWaterSystem[] = [
  { id: 'dhw_gas', label: 'Chauffe-eau gaz', energy: 'gas', efficiency: 0.85, costPerAnnualKwh: 0.5 },
  { id: 'dhw_oil', label: 'Production fioul', energy: 'oil', efficiency: 0.8, costPerAnnualKwh: 0.6 },
  { id: 'dhw_elec', label: 'Ballon électrique', energy: 'elec', efficiency: 0.9, costPerAnnualKwh: 0.3 },
  { id: 'dhw_thermo', label: 'Chauffe-eau thermodynamique', energy: 'elec', efficiency: 2.5, costPerAnnualKwh: 1.2 },
]

/** Electrified target proposed for each current heating system */
export function heatingTargetFor(currentId: string): string {
  return currentId === 'gas_radiant' || currentId === 'elec_joule' ? 'hp_air_air' : 'hp_air_water'
}

export const HEAT_PUMP_IDS = ['hp_air_water', 'hp_air_air']
