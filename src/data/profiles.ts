import type { Scenario } from '../utils/compute'

export interface Profile {
  id: string
  emoji: string
  label: string
  desc: string
  cur: Scenario
  tgt: Scenario
}

export const PROFILES: Profile[] = [
  {
    id: "urban", emoji: "🏢", label: "Appart. urbain", desc: "55m² · DPE D · Gaz · Métro",
    cur: { area: 55, dpe: "D", heating: "gas_boiler", hotWater: "hw_gas", cooking: "cook_gas", transports: [{ mode: "metro", km: 5000, label: "Quotidien", occ: 1 }, { mode: "car_city_petrol", km: 4000, label: "Week-ends", occ: 2 }, { mode: "plane_m", km: 4000, label: "Vacances", occ: 1 }] },
    tgt: { area: 55, dpe: "C", heating: "heat_pump", hotWater: "hw_thermo", cooking: "cook_induction", transports: [{ mode: "metro", km: 5000, label: "Quotidien", occ: 1 }, { mode: "ev_city", km: 4000, label: "Week-ends", occ: 2 }, { mode: "tgv", km: 4000, label: "Vacances", occ: 1 }] },
  },
  {
    id: "periurb", emoji: "🏡", label: "Maison périurb.", desc: "110m² · DPE E · Gaz · 2 voit.",
    cur: { area: 110, dpe: "E", heating: "gas_boiler", hotWater: "hw_gas", cooking: "cook_gas", transports: [{ mode: "car_compact_diesel", km: 15000, label: "Adulte 1", occ: 1 }, { mode: "car_city_petrol", km: 8000, label: "Adulte 2", occ: 1 }, { mode: "plane_m", km: 5000, label: "Vacances", occ: 1 }] },
    tgt: { area: 110, dpe: "C", heating: "heat_pump", hotWater: "hw_thermo", cooking: "cook_induction", transports: [{ mode: "ev_compact", km: 12000, label: "Adulte 1", occ: 1 }, { mode: "vae", km: 3000, label: "Adulte 2", occ: 1 }, { mode: "ev_city", km: 5000, label: "Courses", occ: 2 }, { mode: "tgv", km: 5000, label: "Vacances", occ: 1 }] },
  },
  {
    id: "rural", emoji: "🌾", label: "Maison rurale", desc: "130m² · DPE F · Fioul · SUV",
    cur: { area: 130, dpe: "F", heating: "oil_boiler", hotWater: "hw_oil", cooking: "cook_gas", transports: [{ mode: "car_suv_diesel", km: 20000, label: "Tout usage", occ: 1 }, { mode: "plane_s", km: 2000, label: "Déplac.", occ: 1 }] },
    tgt: { area: 130, dpe: "C", heating: "heat_pump", hotWater: "hw_thermo", cooking: "cook_induction", transports: [{ mode: "ev_compact", km: 15000, label: "Quotidien", occ: 1 }, { mode: "vae", km: 3000, label: "Proximité", occ: 1 }, { mode: "tgv", km: 2000, label: "Déplac.", occ: 1 }] },
  },
  {
    id: "recent", emoji: "🏠", label: "Logement récent", desc: "70m² · DPE B · PAC · Avion",
    cur: { area: 70, dpe: "B", heating: "heat_pump", hotWater: "hw_elec", cooking: "cook_elec", transports: [{ mode: "car_compact_petrol", km: 10000, label: "Travail", occ: 1 }, { mode: "bike", km: 2000, label: "Loisirs", occ: 1 }, { mode: "plane_l", km: 8000, label: "Vacances", occ: 1 }] },
    tgt: { area: 70, dpe: "B", heating: "heat_pump", hotWater: "hw_thermo", cooking: "cook_induction", transports: [{ mode: "ev_compact", km: 8000, label: "Travail", occ: 1 }, { mode: "vae", km: 4000, label: "Loisirs", occ: 1 }, { mode: "tgv", km: 5000, label: "Vacances", occ: 1 }] },
  },
]
