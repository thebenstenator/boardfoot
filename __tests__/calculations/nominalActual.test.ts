import { describe, it, expect } from 'vitest'
import { getNominalActual, getAllNominalSizes } from '@/lib/calculations/nominalActual'


describe('getNominalActual', () => {
  it('returns correct actual dimensions for a 1x4', () => {
    expect(getNominalActual('1x4')).toEqual({ thickness: 0.75, width: 3.5 })
  })

  it('returns correct actual dimensions for a 2x4', () => {
    expect(getNominalActual('2x4')).toEqual({ thickness: 1.5, width: 3.5 })
  })

  it('returns correct actual dimensions for a 4x4', () => {
    expect(getNominalActual('4x4')).toEqual({ thickness: 3.5, width: 3.5 })
  })

  it('returns correct actual dimensions for a 2x12', () => {
    expect(getNominalActual('2x12')).toEqual({ thickness: 1.5, width: 11.25 })
  })

  it('returns null for unknown sizes', () => {
    expect(getNominalActual('3x5')).toBeNull()
  })

  it('returns null for hardwood quarter notation', () => {
    expect(getNominalActual('4/4')).toBeNull()
  })

  it('normalizes input with spaces around x', () => {
    expect(getNominalActual('2 x 4')).toEqual({ thickness: 1.5, width: 3.5 })
  })

  it('normalizes uppercase input', () => {
    expect(getNominalActual('2X4')).toEqual({ thickness: 1.5, width: 3.5 })
  })

  it('normalizes input with leading/trailing whitespace', () => {
    expect(getNominalActual('  1x6  ')).toEqual({ thickness: 0.75, width: 5.5 })
  })
})

describe('getAllNominalSizes', () => {
  it('returns an array of strings', () => {
    const sizes = getAllNominalSizes()
    expect(Array.isArray(sizes)).toBe(true)
    expect(sizes.length).toBeGreaterThan(0)
  })

  it('includes common sizes', () => {
    const sizes = getAllNominalSizes()
    expect(sizes).toContain('2x4')
    expect(sizes).toContain('1x6')
    expect(sizes).toContain('4x4')
  })
})