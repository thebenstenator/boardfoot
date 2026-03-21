import { describe, it, expect } from "vitest";
import {
  calculateEtsyFees,
  suggestedEtsyPrice,
} from "@/lib/calculations/etsyFees";

describe("calculateEtsyFees", () => {
  it("calculates all fee components for a $50 listing", () => {
    const fees = calculateEtsyFees(50);
    expect(fees.listingFee).toBe(0.2);
    expect(fees.transactionFee).toBeCloseTo(3.25, 2); // 6.5% of $50
    expect(fees.paymentFee).toBeCloseTo(1.75, 2); // 3% of $50 + $0.25
    expect(fees.totalFees).toBeCloseTo(5.2, 2);
    expect(fees.netAfterFees).toBeCloseTo(44.8, 2);
  });

  it("calculates fees for a $100 listing", () => {
    const fees = calculateEtsyFees(100);
    expect(fees.transactionFee).toBeCloseTo(6.5, 2);
    expect(fees.paymentFee).toBeCloseTo(3.25, 2);
    expect(fees.totalFees).toBeCloseTo(9.95, 2);
    expect(fees.netAfterFees).toBeCloseTo(90.05, 2);
  });

  it("returns correct structure", () => {
    const fees = calculateEtsyFees(50);
    expect(fees).toHaveProperty("listingFee");
    expect(fees).toHaveProperty("transactionFee");
    expect(fees).toHaveProperty("paymentFee");
    expect(fees).toHaveProperty("totalFees");
    expect(fees).toHaveProperty("netAfterFees");
  });
});

describe("suggestedEtsyPrice", () => {
  it("returns a price higher than suggested retail", () => {
    const cogs = 30;
    const targetMargin = 0.3;
    const suggestedRetail = cogs / (1 - targetMargin);
    const listingPrice = suggestedEtsyPrice(cogs, targetMargin);
    expect(listingPrice).toBeGreaterThan(suggestedRetail);
  });

  it("net after fees equals suggested retail", () => {
    const cogs = 30;
    const targetMargin = 0.3;
    const listingPrice = suggestedEtsyPrice(cogs, targetMargin);
    const fees = calculateEtsyFees(listingPrice);
    const suggestedRetail = cogs / (1 - targetMargin);
    expect(fees.netAfterFees).toBeCloseTo(suggestedRetail, 1);
  });

  it("produces a higher listing price for higher target margin", () => {
    const price20 = suggestedEtsyPrice(30, 0.2);
    const price40 = suggestedEtsyPrice(30, 0.4);
    expect(price40).toBeGreaterThan(price20);
  });
});
