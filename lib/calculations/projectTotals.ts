import { lumberLineCost, convertLFtoBFPrice, calculateBoardFeetFlexible } from './boardFeet'
import type { LengthUnit } from '@/types/bom'
import { applyWasteFactor, wasteAdjustedCost } from './wasteFactor'
import { finishLineCost } from './finishFraction'
import { suggestedEtsyPrice } from './etsyFees'
import type {
  LumberItem,
  HardwareItem,
  FinishItem,
  ProjectLabor,
  UserProfile,
  ProjectTotals,
  LumberTotals,
} from '@/types/bom'

// ─── Lumber ───────────────────────────────────────────────────────────────────

function calcLumberTotals(
  items: LumberItem[],
  projectWasteFactor: number
): LumberTotals {
  let boardFeetNet = 0
  let netCost = 0
  let reclaimedSavings = 0
  // Separate bucket for per_piece items (not waste-adjusted)
  let pieceCost = 0
  let reclaimedPieceSavings = 0

  for (const item of items) {
    if (item.pricing_mode === 'per_piece') {
      // per_piece: cost = price_per_unit * quantity, NOT waste-adjusted
      const lineCost = item.price_per_unit * item.quantity
      if (item.is_reclaimed) {
        reclaimedPieceSavings += lineCost
      } else {
        pieceCost += lineCost
      }
      continue
    }

    // per_bf / per_lf: existing BF-based, waste-adjusted behavior
    const wasteFactor =
      item.waste_override !== null ? item.waste_override : projectWasteFactor

    const bfPerPiece = calculateBoardFeetFlexible(
      item.thickness_in,
      item.width_in,
      item.length_ft,
      (item.length_unit ?? 'ft') as LengthUnit
    )
    const bfTotal = bfPerPiece * item.quantity
    boardFeetNet += bfTotal

    const pricePerBF =
      item.pricing_mode === 'per_lf'
        ? convertLFtoBFPrice(item.price_per_unit, item.thickness_in, item.width_in)
        : item.price_per_unit

    if (item.is_reclaimed) {
      reclaimedSavings += lumberLineCost(bfTotal, pricePerBF)
    } else {
      netCost += lumberLineCost(bfTotal, pricePerBF)
    }
  }

  // Waste-adjust only the BF-based portion, then add piece cost directly
  const adjustedBFCost = wasteAdjustedCost(netCost, projectWasteFactor)
  const adjustedCost = adjustedBFCost + pieceCost
  const wasteCost = adjustedBFCost - netCost
  const boardFeetAdjusted = applyWasteFactor(boardFeetNet, projectWasteFactor)

  return {
    netCost: netCost + pieceCost,
    wasteCost,
    adjustedCost,
    boardFeetNet,
    boardFeetAdjusted,
    reclaimedSavings: reclaimedSavings + reclaimedPieceSavings,
  }
}

// ─── Hardware ─────────────────────────────────────────────────────────────────

function calcHardwareTotal(items: HardwareItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0)
}

// ─── Finish ───────────────────────────────────────────────────────────────────

function calcFinishTotal(items: FinishItem[]): number {
  return items.reduce(
    (sum, item) => sum + finishLineCost(item.container_cost, item.fraction_used),
    0
  )
}

// ─── Labor ────────────────────────────────────────────────────────────────────

function calcLaborTotal(labor: ProjectLabor | null, profile: UserProfile): number {
  if (!labor) return 0
  const rate = labor.hourly_rate ?? profile.hourly_rate
  return rate * labor.estimated_hrs
}

// ─── Overhead ─────────────────────────────────────────────────────────────────

function calcOverheadShare(profile: UserProfile): number {
  if (profile.projects_per_month <= 0) return 0
  return profile.monthly_overhead / profile.projects_per_month
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function calculateProjectTotals(
  lumberItems: LumberItem[],
  hardwareItems: HardwareItem[],
  finishItems: FinishItem[],
  labor: ProjectLabor | null,
  profile: UserProfile,
  projectWasteFactor: number,
  passSavingsToCustomer: boolean = false
): ProjectTotals {
  const lumber = calcLumberTotals(lumberItems, projectWasteFactor)
  const hardwareTotal = calcHardwareTotal(hardwareItems)
  const finishTotal = calcFinishTotal(finishItems)
  const laborTotal = calcLaborTotal(labor, profile)
  const overheadShare = calcOverheadShare(profile)

  const subtotal = lumber.adjustedCost + hardwareTotal + finishTotal
  const grandTotal = subtotal + laborTotal + overheadShare
  const withTax = grandTotal * (1 + profile.tax_rate)

  const targetMargin = labor?.target_margin ?? 0.30

  // When NOT passing savings to customer, price as if reclaimed was bought at market rate
  // so the woodworker keeps the savings (retail is not reduced by reclaimed discount).
  const baseForRetail = passSavingsToCustomer
    ? grandTotal
    : grandTotal + lumber.reclaimedSavings

  const suggestedRetail = baseForRetail / (1 - targetMargin)
  const etsyListingPrice = suggestedEtsyPrice(baseForRetail, targetMargin)

  return {
    lumber,
    hardware: { total: hardwareTotal },
    finish: { total: finishTotal },
    labor: { total: laborTotal },
    overhead: { share: overheadShare },
    subtotal,
    grandTotal,
    withTax,
    suggestedRetail,
    etsyListingPrice,
  }
}
