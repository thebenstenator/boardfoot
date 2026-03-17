import { describe, it, expect } from 'vitest'
import { calculateEtsyFees, suggestedEtsyPrice } from '@/lib/calculations/etsyFees'

describe('calculateEtsyFees', () => {
  it('calculates all fee components for a $50 listing', () => {
    const fees = calculateEtsyFees(50)
    expect(fees.listingFee).toBe(0.20)
    expect(fees.transactionFee).toBeCloseTo(3.25, 2)   // 6.5% of $50
    expect(fees.paymentFee).toBeCloseTo(1.75, 2)       // 3% of $50 + $0.25
    expect(fees.totalFees).toBeCloseTo(5.20, 2)
    expect(fees.netAfterFees).toBeCloseTo(44.80, 2)
  })

  it('calculates fees for a $100 listing', () => {
    const fees = calculateEtsyFees(100)
    expect(fees.transactionFee).toBeCloseTo(6.50, 2)
    expect(fees.paymentFee).toBeCloseTo(3.25, 2)
    expect(fees.totalFees).toBeCloseTo(9.95, 2)
    expect(fees.netAfterFees).toBeCloseTo(90.05, 2)
  })

  it('returns correct structure', () => {
    const fees = calculateEtsyFees(50)
    expect(fees).toHaveProperty('listingFee')
    expect(fees).toHaveProperty('transactionFee')
    expect(fees).toHaveProperty('paymentFee')
    expect(fees).toHaveProperty('totalFees')
    expect(fees).toHaveProperty('netAfterFees')
  })
})

describe('suggestedEtsyPrice', () => {
  it('returns a price higher than COGS', () => {
    const price = suggestedEtsyPrice(30, 0.30)
    expect(price).toBeGreaterThan(30)
  })

  it('accounts for fees and margin at 30% target', () => {
    // At the suggested price, after fees and cogs, margin should be ~30%
    const cogs = 30
    const targetMargin = 0.30
    const price = suggestedEtsyPrice(cogs, targetMargin)
    const fees = calculateEtsyFees(price)
    const actualMargin = (price - fees.totalFees - cogs) / price
    expect(actualMargin).toBeCloseTo(targetMargin, 2)
  })

  it('produces a higher price for higher target margin', () => {
    const price20 = suggestedEtsyPrice(30, 0.20)
    const price40 = suggestedEtsyPrice(30, 0.40)
    expect(price40).toBeGreaterThan(price20)
  })
})