import { describe, it, expect } from 'vitest'
import {
  calculateBoardFeet,
  lumberLineCost,
  convertLFtoBFPrice,
} from '@/lib/calculations/boardFeet'

describe('calculateBoardFeet', () => {
  it('calculates board feet correctly', () => {
    // 1" thick × 6" wide × 8ft long = 4 BF
    expect(calculateBoardFeet(1, 6, 8)).toBeCloseTo(4.0)
  })

  it('handles 4/4 hardwood (1" rough thickness)', () => {
    // 1" × 8" × 10ft = 6.667 BF
    expect(calculateBoardFeet(1, 8, 10)).toBeCloseTo(6.667, 2)
  })

  it('handles 8/4 thick stock', () => {
    // 2" × 6" × 6ft = 6 BF
    expect(calculateBoardFeet(2, 6, 6)).toBeCloseTo(6.0)
  })

  it('returns 0 for zero length', () => {
    expect(calculateBoardFeet(1, 6, 0)).toBe(0)
  })
})

describe('lumberLineCost', () => {
  it('multiplies board feet by price', () => {
    expect(lumberLineCost(4, 15)).toBe(60)
  })

  it('returns 0 for zero board feet', () => {
    expect(lumberLineCost(0, 15)).toBe(0)
  })
})

describe('convertLFtoBFPrice', () => {
  it('converts LF price to BF price for a 2x4', () => {
    // 2x4 actual = 1.5" × 3.5"
    // $1.00/LF → $1.00 × 12 / (1.5 × 3.5) = $2.286/BF
    expect(convertLFtoBFPrice(1.0, 1.5, 3.5)).toBeCloseTo(2.286, 2)
  })
})