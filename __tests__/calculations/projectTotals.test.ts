import { describe, it, expect } from 'vitest'
import { calculateProjectTotals } from '@/lib/calculations/projectTotals'
import type {
  LumberItem,
  HardwareItem,
  FinishItem,
  ProjectLabor,
  UserProfile,
} from '@/types/bom'

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const baseProfile: UserProfile = {
  id: 'user-1',
  display_name: 'Ben',
  hourly_rate: 25,
  tax_rate: 0.08,
  monthly_overhead: 200,
  projects_per_month: 4,
  subscription_tier: 'free',
  stripe_customer_id: null,
  created_at: '2024-01-01',
}

const makeLumberItem = (overrides: Partial<LumberItem> = {}): LumberItem => ({
  id: 'l-1',
  project_id: 'p-1',
  species: 'Black Walnut',
  thickness_in: 1,
  width_in: 6,
  length_ft: 8,
  quantity: 1,
  pricing_mode: 'per_bf',
  price_per_unit: 15,
  is_reclaimed: false,
  waste_override: null,
  notes: '',
  sort_order: 0,
  created_at: '2024-01-01',
  ...overrides,
})

const makeHardwareItem = (overrides: Partial<HardwareItem> = {}): HardwareItem => ({
  id: 'h-1',
  project_id: 'p-1',
  description: 'Pocket screws',
  quantity: 1,
  unit: 'box',
  unit_cost: 12.99,
  notes: '',
  sort_order: 0,
  created_at: '2024-01-01',
  ...overrides,
})

const makeFinishItem = (overrides: Partial<FinishItem> = {}): FinishItem => ({
  id: 'f-1',
  project_id: 'p-1',
  description: 'Polyurethane',
  container_cost: 18,
  fraction_used: 0.5,
  notes: '',
  sort_order: 0,
  created_at: '2024-01-01',
  ...overrides,
})

const makeLabor = (overrides: Partial<ProjectLabor> = {}): ProjectLabor => ({
  id: 'lab-1',
  project_id: 'p-1',
  hourly_rate: null,
  estimated_hrs: 4,
  target_margin: 0.30,
  created_at: '2024-01-01',
  ...overrides,
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('calculateProjectTotals', () => {
 it('returns zero totals for empty project', () => {
  const totals = calculateProjectTotals([], [], [], null, baseProfile, 0.15)
  expect(totals.lumber.netCost).toBe(0)
  expect(totals.hardware.total).toBe(0)
  expect(totals.finish.total).toBe(0)
  expect(totals.labor.total).toBe(0)
  // grandTotal includes overhead share even with no materials ($200/4 = $50)
  expect(totals.overhead.share).toBeCloseTo(50, 2)
  expect(totals.grandTotal).toBeCloseTo(50, 2)
})

  it('calculates lumber cost correctly', () => {
    // 1" × 6" × 8ft = 4 BF, at $15/BF = $60 net
    const totals = calculateProjectTotals(
      [makeLumberItem()],
      [], [], null, baseProfile, 0
    )
    expect(totals.lumber.netCost).toBeCloseTo(60, 2)
    expect(totals.lumber.boardFeetNet).toBeCloseTo(4, 2)
  })

  it('applies waste factor to lumber', () => {
    const totals = calculateProjectTotals(
      [makeLumberItem()],
      [], [], null, baseProfile, 0.15
    )
    // $60 net / (1 - 0.15) = $70.588
    expect(totals.lumber.adjustedCost).toBeCloseTo(70.588, 2)
    expect(totals.lumber.wasteCost).toBeCloseTo(10.588, 2)
  })

  it('calculates hardware total correctly', () => {
    const totals = calculateProjectTotals(
      [],
      [makeHardwareItem({ quantity: 2, unit_cost: 12.99 })],
      [], null, baseProfile, 0.15
    )
    expect(totals.hardware.total).toBeCloseTo(25.98, 2)
  })

  it('calculates finish total correctly', () => {
    const totals = calculateProjectTotals(
      [], [],
      [makeFinishItem({ container_cost: 18, fraction_used: 0.5 })],
      null, baseProfile, 0.15
    )
    expect(totals.finish.total).toBeCloseTo(9, 2)
  })

  it('calculates labor using profile rate when item rate is null', () => {
    // profile hourly_rate = 25, estimated_hrs = 4 → $100
    const totals = calculateProjectTotals(
      [], [], [],
      makeLabor({ hourly_rate: null, estimated_hrs: 4 }),
      baseProfile, 0.15
    )
    expect(totals.labor.total).toBeCloseTo(100, 2)
  })

  it('uses labor item rate when set, overriding profile rate', () => {
    // item hourly_rate = 40, estimated_hrs = 4 → $160
    const totals = calculateProjectTotals(
      [], [], [],
      makeLabor({ hourly_rate: 40, estimated_hrs: 4 }),
      baseProfile, 0.15
    )
    expect(totals.labor.total).toBeCloseTo(160, 2)
  })

  it('calculates overhead share from profile', () => {
    // $200/month / 4 projects = $50 per project
    const totals = calculateProjectTotals(
      [], [], [], null, baseProfile, 0.15
    )
    expect(totals.overhead.share).toBeCloseTo(50, 2)
  })

  it('calculates grand total as sum of all categories', () => {
    const totals = calculateProjectTotals(
      [makeLumberItem()],
      [makeHardwareItem()],
      [makeFinishItem()],
      makeLabor(),
      baseProfile,
      0.15
    )
    const expected =
      totals.lumber.adjustedCost +
      totals.hardware.total +
      totals.finish.total +
      totals.labor.total +
      totals.overhead.share
    expect(totals.grandTotal).toBeCloseTo(expected, 2)
  })

  it('applies tax rate to grand total', () => {
    const totals = calculateProjectTotals(
      [makeLumberItem()],
      [], [], null, baseProfile, 0
    )
    expect(totals.withTax).toBeCloseTo(totals.grandTotal * 1.08, 2)
  })

  it('suggested retail is higher than grand total', () => {
    const totals = calculateProjectTotals(
      [makeLumberItem()],
      [makeHardwareItem()],
      [makeFinishItem()],
      makeLabor(),
      baseProfile,
      0.15
    )
    expect(totals.suggestedRetail).toBeGreaterThan(totals.grandTotal)
  })

  it('etsy listing price is higher than grand total', () => {
    const totals = calculateProjectTotals(
      [makeLumberItem()],
      [makeHardwareItem()],
      [makeFinishItem()],
      makeLabor(),
      baseProfile,
      0.15
    )
    expect(totals.etsyListingPrice).toBeGreaterThan(totals.grandTotal)
  })

  it('handles per_lf pricing mode', () => {
    // 2x4 actual = 1.5" × 3.5", 8ft long, $1.50/LF
    const item = makeLumberItem({
      thickness_in: 1.5,
      width_in: 3.5,
      length_ft: 8,
      pricing_mode: 'per_lf',
      price_per_unit: 1.50,
    })
    const totals = calculateProjectTotals([item], [], [], null, baseProfile, 0)
    // BF = (1.5 × 3.5 × 8) / 12 = 3.5 BF
    // $/BF = 1.50 × 12 / (1.5 × 3.5) = 3.428/BF
    // cost = 3.5 × 3.428 = $12
    expect(totals.lumber.netCost).toBeCloseTo(12, 1)
  })
})