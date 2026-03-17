import { describe, it, expect } from 'vitest'
import { applyWasteFactor, wasteAdjustedCost } from '@/lib/calculations/wasteFactor'

describe('applyWasteFactor', () => {
  it('uses margin math, not additive markup', () => {
    // This is the critical test — 100 / (1 - 0.15) = 117.647, NOT 115
    expect(applyWasteFactor(100, 0.15)).toBeCloseTo(117.647, 2)
  })

  it('returns net qty unchanged when waste factor is 0', () => {
    expect(applyWasteFactor(100, 0)).toBe(100)
  })

  it('returns net qty unchanged when waste factor is negative', () => {
    expect(applyWasteFactor(100, -0.1)).toBe(100)
  })

  it('returns net qty unchanged when waste factor is 1 or more', () => {
    expect(applyWasteFactor(100, 1)).toBe(100)
    expect(applyWasteFactor(100, 1.5)).toBe(100)
  })

  it('handles 20% waste factor', () => {
    // 100 / (1 - 0.20) = 125
    expect(applyWasteFactor(100, 0.20)).toBeCloseTo(125, 2)
  })

  it('handles 35% waste factor for complex cuts', () => {
    // 100 / (1 - 0.35) = 153.846
    expect(applyWasteFactor(100, 0.35)).toBeCloseTo(153.846, 2)
  })
})

describe('wasteAdjustedCost', () => {
  it('applies the same margin math to cost figures', () => {
    expect(wasteAdjustedCost(100, 0.15)).toBeCloseTo(117.647, 2)
  })

  it('returns cost unchanged at zero waste', () => {
    expect(wasteAdjustedCost(50, 0)).toBe(50)
  })
})