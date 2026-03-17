/**
 * Board Feet Calculations
 *
 * Board foot formula: (thickness_in × width_in × length_ft) / 12
 * This uses ROUGH thickness (e.g. 4/4 lumber = 1.0", not the milled 0.75")
 */

export function calculateBoardFeet(
  thickness_in: number,
  width_in: number,
  length_ft: number
): number {
  return (thickness_in * width_in * length_ft) / 12
}

/**
 * Calculate the cost of a lumber line item priced per board foot
 */
export function lumberLineCost(boardFeet: number, pricePerBF: number): number {
  return boardFeet * pricePerBF
}

/**
 * Convert a per-linear-foot price to a per-board-foot price.
 * Used for dimensional lumber (2x4s, etc.) sold by the linear foot.
 *
 * Formula: price_per_bf = price_per_lf × 12 / (thickness_in × width_in)
 */
export function convertLFtoBFPrice(
  pricePerLF: number,
  thickness_in: number,
  width_in: number
): number {
  return (pricePerLF * 12) / (thickness_in * width_in)
}