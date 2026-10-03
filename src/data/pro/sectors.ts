/**
 * Sector profiles: consumption ratios (kWh/m²/year) and pre-filled typical company.
 * Ratios are orders of magnitude consistent with OPERAT/CEREN ranges
 * (offices 100-200 kWh/m², heating ≈ 50 % of tertiary consumption).
 * They are a fallback: users can enter their real consumption instead.
 * Heating and hot water ratios are USEFUL needs (final energy × reference efficiency).
 */

export interface FleetLine {
  category: string
  count: number
  /** km per vehicle per year */
  kmPerVehicle: number
}

export interface SectorRatios {
  /** Useful heating need, kWh/m²/year */
  heatingNeed: number
  /** Useful hot water need, kWh/m²/year */
  hotWaterNeed: number
  /** Cooling, electricity kWh/m²/year */
  cooling: number
  /** Lighting, electricity kWh/m²/year */
  lighting: number
}

export interface Sector {
  id: string
  emoji: string
  label: string
  desc: string
  ratios: SectorRatios
  defaults: {
    area: number
    staff: number
    heating: string
    hotWater: string
    fleet: FleetLine[]
  }
}

export const SECTORS: Sector[] = [
  {
    id: 'office', emoji: '🏢', label: 'Bureaux, services', desc: '800 m² · 30 salariés · gaz',
    ratios: { heatingNeed: 69, hotWaterNeed: 7, cooling: 15, lighting: 22 },
    defaults: { area: 800, staff: 30, heating: 'gas_boiler', hotWater: 'dhw_elec', fleet: [{ category: 'car_diesel', count: 3, kmPerVehicle: 20000 }] },
  },
  {
    id: 'retail', emoji: '🛍️', label: 'Commerce', desc: '400 m² · 10 salariés · rooftop',
    ratios: { heatingNeed: 64, hotWaterNeed: 4, cooling: 25, lighting: 50 },
    defaults: { area: 400, staff: 10, heating: 'hp_air_air', hotWater: 'dhw_elec', fleet: [{ category: 'van_diesel', count: 1, kmPerVehicle: 15000 }] },
  },
  {
    id: 'hospitality', emoji: '🏨', label: 'Hôtellerie, santé, sport', desc: '1 500 m² · 25 salariés · gaz',
    ratios: { heatingNeed: 110, hotWaterNeed: 43, cooling: 15, lighting: 30 },
    defaults: { area: 1500, staff: 25, heating: 'gas_boiler', hotWater: 'dhw_gas', fleet: [{ category: 'van_diesel', count: 1, kmPerVehicle: 10000 }] },
  },
  {
    id: 'trades', emoji: '🔧', label: 'Artisan, services itinérants', desc: '300 m² · 12 salariés · 6 utilitaires',
    ratios: { heatingNeed: 74, hotWaterNeed: 4, cooling: 5, lighting: 20 },
    defaults: { area: 300, staff: 12, heating: 'gas_boiler', hotWater: 'dhw_elec', fleet: [{ category: 'van_diesel', count: 6, kmPerVehicle: 25000 }, { category: 'car_diesel', count: 1, kmPerVehicle: 25000 }] },
  },
  {
    id: 'warehouse', emoji: '📦', label: 'Entrepôt, atelier léger', desc: '2 000 m² · 15 salariés · radiants gaz',
    ratios: { heatingNeed: 51, hotWaterNeed: 3, cooling: 0, lighting: 18 },
    defaults: { area: 2000, staff: 15, heating: 'gas_radiant', hotWater: 'dhw_elec', fleet: [{ category: 'van_diesel', count: 3, kmPerVehicle: 20000 }, { category: 'car_diesel', count: 1, kmPerVehicle: 20000 }] },
  },
]
