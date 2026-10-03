/**
 * Employee mobility defaults (home-to-work commute).
 * Modal shares: Insee Focus n°143 (2015 data) — car 70 %, public transport 16 %,
 * walking 7 %, two-wheelers 4 %, no transport 3 %.
 * Distance and working days: simulator assumptions, editable in the UI.
 * Emission factors and costs come from the Particulier TRANSPORT_MODES (per passenger.km).
 */

export interface CommuteMode {
  id: string
  label: string
  /** TRANSPORT_MODES id used for EF and cost (null = no motorised transport) */
  mode: string | null
  /** Default share of employees, % */
  share: number
}

export const COMMUTE_MODES: CommuteMode[] = [
  { id: 'car', label: 'Voiture thermique', mode: 'car_avg', share: 70 },
  { id: 'car_ev', label: 'Voiture électrique', mode: 'ev_compact', share: 0 },
  { id: 'bus', label: 'Bus', mode: 'bus_therm', share: 8 },
  { id: 'rail', label: 'Métro, tram, train', mode: 'metro', share: 8 },
  { id: 'active', label: 'Vélo, marche', mode: 'bike', share: 11 },
  { id: 'none', label: 'Sans déplacement', mode: null, share: 3 },
]

export const DEFAULT_COMMUTE_KM = 12
export const DEFAULT_WORKING_DAYS = 210
