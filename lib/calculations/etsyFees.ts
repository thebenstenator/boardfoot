/**
 * Etsy Fee Calculations
 *
 * Etsy charges sellers three fees per transaction:
 * - Listing fee:          $0.20 flat per listing
 * - Transaction fee:      6.5% of the listing price
 * - Payment processing:   3% of listing price + $0.25
 *
 * To find the right listing price given a target profit margin,
 * we need to work backwards from the desired net after fees.
 */

export interface EtsyFeeBreakdown {
  listingFee: number        // flat $0.20
  transactionFee: number    // 6.5% of listing price
  paymentFee: number        // 3% + $0.25
  totalFees: number         // sum of all fees
  netAfterFees: number      // listing price minus all fees
}

export function calculateEtsyFees(listingPrice: number): EtsyFeeBreakdown {
  const listingFee = 0.20
  const transactionFee = listingPrice * 0.065
  const paymentFee = listingPrice * 0.03 + 0.25
  const totalFees = listingFee + transactionFee + paymentFee
  const netAfterFees = listingPrice - totalFees

  return {
    listingFee,
    transactionFee,
    paymentFee,
    totalFees,
    netAfterFees,
  }
}

/**
 * Calculate the Etsy listing price needed to hit a target margin after fees.
 *
 * We need to find a listing price where:
 * (listingPrice - fees - cogs) / listingPrice >= targetMargin
 *
 * Since fees are partly a percentage of listing price, we solve iteratively.
 * Etsy's combined percentage fees = 6.5% + 3% = 9.5%
 * Flat fees = $0.20 + $0.25 = $0.45
 *
 * Formula: listingPrice = (cogs + flatFees) / (1 - percentFees - targetMargin)
 */
export function suggestedEtsyPrice(cogs: number, targetMargin: number): number {
  const percentFees = 0.065 + 0.03   // 9.5%
  const flatFees = 0.20 + 0.25       // $0.45

  return (cogs + flatFees) / (1 - percentFees - targetMargin)
}