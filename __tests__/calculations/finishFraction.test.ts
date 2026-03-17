import { describe, it, expect } from 'vitest'
import { finishLineCost } from '@/lib/calculations/finishFraction'

describe('finishLineCost', () => {
  it('calculates partial container cost correctly', () => {
    // $18 container, 33% used = $5.94
    expect(finishLineCost(18, 0.33)).toBeCloseTo(5.94, 2)
  })

  it('returns full container cost at 100% fraction', () => {
    expect(finishLineCost(18, 1.0)).toBe(18)
  })

  it('returns 0 for 0% fraction', () => {
    expect(finishLineCost(18, 0)).toBe(0)
  })

  it('caps at full container cost if fraction exceeds 1', () => {
    expect(finishLineCost(18, 1.5)).toBe(18)
  })

  it('returns 0 for negative fraction', () => {
    expect(finishLineCost(18, -0.1)).toBe(0)
  })

  it('handles a pint of stain at 40% used', () => {
    expect(finishLineCost(14.99, 0.40)).toBeCloseTo(5.996, 2)
  })
})