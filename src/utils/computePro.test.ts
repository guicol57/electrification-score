import { describe, it, expect } from 'vitest'
import { SECTORS, DEFAULT_PRICES, COMMUTE_MODES, DEFAULT_COMMUTE_KM, DEFAULT_WORKING_DAYS } from '../data/pro'
import {
  computeNeeds, computeProAnnual, computeMobility, computeBenchmark,
  buildLevers, evaluateLevers, applyLevers, cumulativeCosts,
  type ProInput, type ProScenario,
} from './computePro'

const defaultShares = Object.fromEntries(COMMUTE_MODES.map(m => [m.id, m.share]))

function inputFor(sectorId: string, overrides: Partial<ProInput> = {}): ProInput {
  const s = SECTORS.find(x => x.id === sectorId)!
  return {
    sectorId, area: s.defaults.area, staff: s.defaults.staff,
    buildingMode: 'ratio', realHeatingKwh: 0, realHotWaterKwh: 0, realElecOtherKwh: 0,
    heating: s.defaults.heating, hotWater: s.defaults.hotWater,
    fleet: s.defaults.fleet.map(l => ({ ...l })),
    travel: [],
    commute: { kmOneWay: DEFAULT_COMMUTE_KM, days: DEFAULT_WORKING_DAYS, shares: defaultShares },
    prices: { ...DEFAULT_PRICES },
    ...overrides,
  }
}

const scOf = (i: ProInput): ProScenario => ({ heating: i.heating, hotWater: i.hotWater, fleet: i.fleet })

describe('computeProAnnual — office reference case (hand-computed)', () => {
  // 800 m² office, gas boiler, electric hot water, 3 diesel cars × 20 000 km
  const input = inputFor('office')
  const r = computeProAnnual(input, computeNeeds(input), scOf(input))

  it('final energy', () => {
    // gas 55 200/0.92 = 60 000 · ECS 5 600/0.9 = 6 222 · cooling+lighting 29 600 · diesel 60 000 km × 5.5 L × 10 = 33 000
    expect(r.totalKwh).toBeCloseTo(128822.2, 0)
    expect(r.electricPct).toBeCloseTo(27.81, 1)
    expect(r.fossilPct).toBeCloseTo(72.19, 1)
    expect(r.elecScore.g).toBe('D')
    expect(r.fossilScore.g).toBe('D')
  })

  it('emissions and costs', () => {
    // 13 620 gas + 2 149 elec + 11 484 diesel + 2 460 car manufacturing
    expect(r.totalCO2).toBeCloseTo(29713, 0)
    // 5 400 + 336 maint + 1 120 + 5 328 + 4 785 + 3 000 maint
    expect(r.totalCost).toBeCloseTo(19969, 0)
    const parts = r.costByKind.fossil + r.costByKind.electric + r.costByKind.other
    expect(parts).toBeCloseTo(r.totalCost, 6)
  })

  it('family split', () => {
    expect(r.fleetElecPct).toBe(0)
    expect(r.buildingKwh + r.fleetKwh).toBeCloseTo(r.totalKwh, 6)
  })
})

describe('computeNeeds', () => {
  it('useful needs do not depend on the scenario equipment', () => {
    const input = inputFor('office')
    const a = computeNeeds(input)
    const b = computeNeeds({ ...input, heating: 'hp_air_water' })
    expect(b).toEqual(a)
  })

  it('real mode converts the current final consumption to useful need', () => {
    const input = inputFor('office', { buildingMode: 'real', realHeatingKwh: 100000, realHotWaterKwh: 10000, realElecOtherKwh: 20000 })
    const n = computeNeeds(input)
    expect(n.heating).toBeCloseTo(92000, 6)
    expect(n.hotWater).toBeCloseTo(9000, 6)
    expect(n.elecOther).toBe(20000)
    // round trip: current scenario gives back the entered consumption
    const r = computeProAnnual(input, n, scOf(input))
    expect(r.lines.find(l => l.id === 'heating')!.kwh.gas).toBeCloseTo(100000, 6)
  })
})

describe('all-electric site', () => {
  it('scores A on electrification and on fossil exposure', () => {
    const input = inputFor('office', { heating: 'hp_air_water', hotWater: 'dhw_thermo', fleet: [{ category: 'car_ev', count: 3, kmPerVehicle: 20000 }] })
    const r = computeProAnnual(input, computeNeeds(input), scOf(input))
    expect(r.electricPct).toBeCloseTo(100, 6)
    expect(r.elecScore.g).toBe('A')
    expect(r.fossilScore.g).toBe('A')
  })
})

describe('action plan on the 5 sector profiles', () => {
  for (const s of SECTORS) {
    it(`${s.label}: applying every lever electrifies and cuts emissions`, () => {
      const input = inputFor(s.id)
      const needs = computeNeeds(input)
      const cur = scOf(input)
      const levers = buildLevers(input, needs, cur)
      const results = evaluateLevers(input, needs, cur, levers, {})
      const tgt = applyLevers(cur, levers, levers.map(l => l.id))
      const rc = computeProAnnual(input, needs, cur)
      const rt = computeProAnnual(input, needs, tgt)

      expect(levers.length).toBeGreaterThan(0)
      expect(rt.electricPct).toBeGreaterThan(rc.electricPct)
      expect(rt.totalCO2).toBeLessThan(rc.totalCO2)
      expect(rt.fossilPct).toBeLessThanOrEqual(rc.fossilPct)
      // sorted by payback
      for (let i = 1; i < results.length; i++) expect(results[i].payback).toBeGreaterThanOrEqual(results[i - 1].payback)
      // every lever avoids emissions on its own
      for (const r of results) expect(r.co2Avoided).toBeGreaterThan(0)
    })
  }
})

describe('levers', () => {
  it('van conversion = price gap + one charger per vehicle', () => {
    const input = inputFor('trades')
    const needs = computeNeeds(input)
    const lever = buildLevers(input, needs, scOf(input)).find(l => l.id === 'fleet-0')!
    expect(lever.investment).toBe(6 * (40000 - 30000 + 1500))
  })

  it('aid reduces the net investment and the payback', () => {
    const input = inputFor('office')
    const needs = computeNeeds(input)
    const levers = buildLevers(input, needs, scOf(input))
    const [noAid] = evaluateLevers(input, needs, scOf(input), levers.filter(l => l.id === 'heating'), { heating: 0 })
    const [aid] = evaluateLevers(input, needs, scOf(input), levers.filter(l => l.id === 'heating'), { heating: 50 })
    expect(aid.netInvestment).toBeCloseTo(noAid.netInvestment / 2, 6)
    expect(aid.payback).toBeLessThan(noAid.payback)
  })

  it('no lever for equipment that is already electrified', () => {
    const input = inputFor('office', { heating: 'hp_air_air', hotWater: 'dhw_thermo', fleet: [{ category: 'car_ev', count: 2, kmPerVehicle: 10000 }] })
    expect(buildLevers(input, computeNeeds(input), scOf(input))).toEqual([])
  })
})

describe('computeMobility', () => {
  it('commute: 30 staff × 12 km × 2 × 210 days with default modal shares', () => {
    const r = computeMobility(inputFor('office'))
    // 97 % of staff travel: 30 × 0.97 × 5 040 km
    expect(r.totalKm).toBeCloseTo(146664, 0)
    // bus (thermal) and car are fossil; rail and active modes are not → (8 + 11) / 97
    expect(r.nonFossilKmPct).toBeCloseTo(19 / 97 * 100, 4)
  })

  it('business travel by train counts as non-fossil', () => {
    const r = computeMobility(inputFor('office', { staff: 0, travel: [{ mode: 'tgv', km: 10000 }, { mode: 'plane_m', km: 10000 }] }))
    expect(r.nonFossilKmPct).toBeCloseTo(50, 6)
    expect(r.travelCO2).toBeCloseTo(10000 * 0.003 + 10000 * 0.10, 6)
  })
})

describe('benchmark and business case', () => {
  it('sector default site matches its own reference', () => {
    const input = inputFor('office')
    const r = computeProAnnual(input, computeNeeds(input), scOf(input))
    const b = computeBenchmark(input, r)
    expect(b.userKwhPerM2).toBeCloseTo(b.refKwhPerM2, 6)
    expect(b.userElecPct).toBeCloseTo(b.refElecPct, 6)
  })

  it('cumulative costs start at the net investment', () => {
    const input = inputFor('office')
    const r = computeProAnnual(input, computeNeeds(input), scOf(input))
    const pts = cumulativeCosts(r, r, 10000, 10, 5, 2)
    expect(pts[0]).toEqual({ year: 0, actuel: 0, cible: 10000 })
    expect(pts).toHaveLength(11)
    expect(pts[10].cible - pts[10].actuel).toBeCloseTo(10000, 6)
  })
})
