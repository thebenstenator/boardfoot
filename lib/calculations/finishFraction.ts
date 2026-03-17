/**
 * Finishing Materials Cost Calculations
 *
 * Finishing supplies (stain, poly, oil) are often shared across projects.
 * Instead of charging a full container to one project, users enter what
 * fraction of the container this project will consume.
 *
 * Example: A quart of poly costs $18. This project uses about 1/3 of it.
 * Line cost = $18 × 0.33 = $5.94
 */

export function finishLineCost(
  containerCost: number,
  fractionUsed: number
): number {
  if (fractionUsed < 0) return 0
  if (fractionUsed > 1) return containerCost
  return containerCost * fractionUsed
}