/**
 * Transport mode data
 * Sources:
 *  - Emission factors: Base Carbone ADEME (France 2020-2025) via Ecodex MCP
 *    Scope: combustion + upstream energy + vehicle manufacturing
 *  - Costs: TCO complet (CAPEX amortisation + OPEX energy/maintenance)
 *    Sources: Bornetik, Arval TCO Scope 2024, France Stratégie 2022
 */

export interface TransportMode {
  id: string
  label: string
  /** kgCO2eq per km */
  ef: number
  /** CAPEX: amortisation cost per km (€/km) */
  capex: number
  /** OPEX: energy + maintenance per km (€/km) */
  opex: number
  fossil: boolean
  electric: boolean
  /** Is a personal vehicle (affected by occupancy rate) */
  perVehicle: boolean
  /** Category for grouped select */
  category: string
  /** Vehicle purchase cost (€) for investment delta */
  vehicleCost: number
}

export const TRANSPORT_MODES: TransportMode[] = [
  // Voitures thermiques par segment
  { id: "car_city_petrol", label: "🚗 Citadine essence", ef: 0.17, capex: 0.16, opex: 0.18, fossil: true, electric: false, perVehicle: true, category: "Voiture", vehicleCost: 18000 },
  { id: "car_compact_petrol", label: "🚗 Compacte essence", ef: 0.23, capex: 0.20, opex: 0.20, fossil: true, electric: false, perVehicle: true, category: "Voiture", vehicleCost: 25000 },
  { id: "car_suv_petrol", label: "🚗 Berline/SUV essence", ef: 0.35, capex: 0.26, opex: 0.24, fossil: true, electric: false, perVehicle: true, category: "Voiture", vehicleCost: 40000 },
  { id: "car_compact_diesel", label: "🚗 Compacte diesel", ef: 0.22, capex: 0.20, opex: 0.18, fossil: true, electric: false, perVehicle: true, category: "Voiture", vehicleCost: 27000 },
  { id: "car_suv_diesel", label: "🚗 Berline/SUV diesel", ef: 0.28, capex: 0.26, opex: 0.22, fossil: true, electric: false, perVehicle: true, category: "Voiture", vehicleCost: 42000 },
  { id: "car_avg", label: "🚗 Voiture moy. thermique", ef: 0.25, capex: 0.20, opex: 0.20, fossil: true, electric: false, perVehicle: true, category: "Voiture", vehicleCost: 25000 },
  // VE par segment
  { id: "ev_city", label: "⚡ Citadine électrique", ef: 0.10, capex: 0.18, opex: 0.07, fossil: false, electric: true, perVehicle: true, category: "Voiture", vehicleCost: 25000 },
  { id: "ev_compact", label: "⚡ Compacte électrique", ef: 0.10, capex: 0.22, opex: 0.08, fossil: false, electric: true, perVehicle: true, category: "Voiture", vehicleCost: 35000 },
  { id: "ev_suv", label: "⚡ Berline/SUV électrique", ef: 0.14, capex: 0.28, opex: 0.09, fossil: false, electric: true, perVehicle: true, category: "Voiture", vehicleCost: 50000 },
  // Hybrides rechargeables
  { id: "phev_compact", label: "🔌 Compacte hybride rech.", ef: 0.07, capex: 0.24, opex: 0.10, fossil: false, electric: true, perVehicle: true, category: "Voiture", vehicleCost: 35000 },
  { id: "phev_suv", label: "🔌 SUV hybride rech.", ef: 0.10, capex: 0.28, opex: 0.12, fossil: false, electric: true, perVehicle: true, category: "Voiture", vehicleCost: 48000 },
  // 2-roues
  { id: "moto", label: "🏍️ Moto thermique", ef: 0.22, capex: 0.10, opex: 0.12, fossil: true, electric: false, perVehicle: true, category: "2-roues", vehicleCost: 8000 },
  { id: "vae", label: "🚲 Vélo électrique", ef: 0.01, capex: 0.03, opex: 0.02, fossil: false, electric: true, perVehicle: false, category: "2-roues", vehicleCost: 2500 },
  { id: "bike", label: "🚶 Vélo / marche", ef: 0, capex: 0.005, opex: 0.005, fossil: false, electric: false, perVehicle: false, category: "2-roues", vehicleCost: 500 },
  // Transports en commun
  { id: "bus_therm", label: "🚌 Bus thermique", ef: 0.15, capex: 0, opex: 0.10, fossil: true, electric: false, perVehicle: false, category: "TC", vehicleCost: 0 },
  { id: "bus_elec", label: "🚌 Bus électrique", ef: 0.02, capex: 0, opex: 0.10, fossil: false, electric: true, perVehicle: false, category: "TC", vehicleCost: 0 },
  { id: "metro", label: "🚇 Métro / Tramway", ef: 0.005, capex: 0, opex: 0.08, fossil: false, electric: true, perVehicle: false, category: "TC", vehicleCost: 0 },
  { id: "ter", label: "🚆 TER", ef: 0.03, capex: 0, opex: 0.12, fossil: false, electric: true, perVehicle: false, category: "TC", vehicleCost: 0 },
  { id: "tgv", label: "🚄 TGV", ef: 0.003, capex: 0, opex: 0.10, fossil: false, electric: true, perVehicle: false, category: "TC", vehicleCost: 0 },
  // Avion
  { id: "plane_s", label: "✈️ Avion (<1000km)", ef: 0.16, capex: 0, opex: 0.15, fossil: true, electric: false, perVehicle: false, category: "Avion", vehicleCost: 0 },
  { id: "plane_m", label: "✈️ Avion (1-5000km)", ef: 0.10, capex: 0, opex: 0.12, fossil: true, electric: false, perVehicle: false, category: "Avion", vehicleCost: 0 },
  { id: "plane_l", label: "✈️ Avion (>5000km)", ef: 0.08, capex: 0, opex: 0.08, fossil: true, electric: false, perVehicle: false, category: "Avion", vehicleCost: 0 },
]
