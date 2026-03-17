/**
 * Waste Factor Calculations
 *
 * IMPORTANT: We use margin math, not additive markup.
 *
 * WRONG (what most people assume):  purchase_qty = net_qty × (1 + waste_factor)
 * RIGHT (what we use):              purchase_qty = net_qty / (1 - waste_factor)
 *
 * Why it matters:
 * At 15% waste, additive gives you 115 BF when you need 100 BF net.
 * But if 15% of your PURCHASE is waste, you need 117.65 BF to end up with 100 BF usable.
 * The margin formula ensures you actually have enough material after waste.
 */

export function applyWasteFactor(netQty: number, wasteFactor: number): number {
  if (wasteFactor <= 0) return netQty
  if (wasteFactor >= 1) return netQty
  return netQty / (1 - wasteFactor)
}

/**
 * Apply waste factor to a cost figure rather than a quantity.
 * Same math — if you need to spend $100 net, how much should you budget?
 */
export function wasteAdjustedCost(netCost: number, wasteFactor: number): number {
  return applyWasteFactor(netCost, wasteFactor)
}