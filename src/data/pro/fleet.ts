/**
 * Company fleet categories.
 * Emission factor per km = fuel + electricity consumption × energy EF + manufacturing per km.
 * Sources:
 *  - Manufacturing: Base Carbone ADEME via Ecodex MCP — "Voiture Motorisation gazole" 2023
 *    cradle-to-gate 0.041 kgCO2eq/km; "Voiture particulière Entrée de gamme - Véhicule léger
 *    Electrique" 2020 cradle-to-gate 0.079 kgCO2eq/km. Vans: car values × 1.2 (assumption).
 *  - Resulting totals cross-checked against Base Carbone 2023 "Voiture Motorisation gazole"
 *    (0.24 kgCO2eq/km) and DEFRA 2026 "Average (up to 3.5 tonnes) Diesel Van"
 *    (0.318 kgCO2eq/km excl. manufacturing).
 *  - Consumptions, purchase prices (€ HT) and maintenance: simulator assumptions, Arval TCO Scope.
 */

export interface FleetCategory {
  id: string
  label: string
  group: 'Voiture' | 'Utilitaire'
  /** Fuel consumption, L/100 km (0 if none) */
  fuelL100: number
  fuel: 'diesel' | 'petrol' | null
  /** Electricity consumption, kWh/100 km (0 if none) */
  elecKwh100: number
  /** Manufacturing emissions, kgCO2eq/km */
  mfgPerKm: number
  /** Maintenance, € HT/km */
  maintPerKm: number
  /** Purchase price, € HT */
  price: number
  /** Electric counterpart proposed in the action plan (null = already electric) */
  electricTarget: string | null
}

export const FLEET_CATEGORIES: FleetCategory[] = [
  { id: 'car_petrol', label: 'Voiture essence', group: 'Voiture', fuelL100: 6.5, fuel: 'petrol', elecKwh100: 0, mfgPerKm: 0.041, maintPerKm: 0.05, price: 25000, electricTarget: 'car_ev' },
  { id: 'car_diesel', label: 'Voiture diesel', group: 'Voiture', fuelL100: 5.5, fuel: 'diesel', elecKwh100: 0, mfgPerKm: 0.041, maintPerKm: 0.05, price: 28000, electricTarget: 'car_ev' },
  { id: 'car_phev', label: 'Voiture hybride rechargeable', group: 'Voiture', fuelL100: 4.0, fuel: 'petrol', elecKwh100: 8, mfgPerKm: 0.05, maintPerKm: 0.05, price: 38000, electricTarget: 'car_ev' },
  { id: 'car_ev', label: 'Voiture électrique', group: 'Voiture', fuelL100: 0, fuel: null, elecKwh100: 17, mfgPerKm: 0.079, maintPerKm: 0.03, price: 33000, electricTarget: null },
  { id: 'van_diesel', label: 'Utilitaire diesel (< 3,5 t)', group: 'Utilitaire', fuelL100: 8.5, fuel: 'diesel', elecKwh100: 0, mfgPerKm: 0.05, maintPerKm: 0.07, price: 30000, electricTarget: 'van_ev' },
  { id: 'van_ev', label: 'Utilitaire électrique (< 3,5 t)', group: 'Utilitaire', fuelL100: 0, fuel: null, elecKwh100: 25, mfgPerKm: 0.095, maintPerKm: 0.045, price: 40000, electricTarget: null },
]

/** Cost of one workplace charging point (AC 7-22 kW), € HT installed */
export const CHARGER_COST = 1500
