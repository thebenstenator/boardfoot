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
  listingFee: number; // flat $0.20
  transactionFee: number; // 6.5% of listing price
  paymentFee: number; // 3% + $0.25
  totalFees: number; // sum of all fees
  netAfterFees: number; // listing price minus all fees
}

export function calculateEtsyFees(listingPrice: number): EtsyFeeBreakdown {
  const listingFee = 0.2;
  const transactionFee = listingPrice * 0.065;
  const paymentFee = listingPrice * 0.03 + 0.25;
  const totalFees = listingFee + transactionFee + paymentFee;
  const netAfterFees = listingPrice - totalFees;

  return {
    listingFee,
    transactionFee,
    paymentFee,
    totalFees,
    netAfterFees,
  };
}

/**
 * Calculate the Etsy listing price needed so that net after fees
 * equals the same profit as a direct sale at suggested retail.
 *
 * We want: listingPrice - fees = suggestedRetail
 * Fees = listingPrice × 0.095 + $0.45
 *
 * So: listingPrice - (listingPrice × 0.095 + 0.45) = suggestedRetail
 *     listingPrice × (1 - 0.095) = suggestedRetail + 0.45
 *     listingPrice = (suggestedRetail + 0.45) / (1 - 0.095)
 */
export function suggestedEtsyPrice(cogs: number, targetMargin: number): number {
  const suggestedRetail = cogs / (1 - targetMargin);
  const percentFees = 0.065 + 0.03; // 9.5%
  const flatFees = 0.2 + 0.25; // $0.45

  return (suggestedRetail + flatFees) / (1 - percentFees);
}
