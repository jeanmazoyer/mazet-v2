import { describe, expect, it } from "vitest";
import { calculateQuote, parseMoneyToCents, VAT_RATES_BP } from "./quoteMath";

// Money is kept in whole cents and VAT in basis points (5.5 % = 550), so no float error can
// move a total by a cent. Figures are invented.

describe("parseMoneyToCents", () => {
  it("reads a decimal amount exactly", () => {
    expect(parseMoneyToCents("1234.50")).toBe(123450);
    expect(parseMoneyToCents("0.10")).toBe(10);
    expect(parseMoneyToCents("12")).toBe(1200);
  });

  it("refuses a negative or malformed amount", () => {
    expect(parseMoneyToCents("-1")).toBeNull();
    expect(parseMoneyToCents("12,5")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeNull();
  });
});

describe("calculateQuote", () => {
  it("totals the lines and the VAT, in cents", () => {
    const q = calculateQuote([
      { quantity: 3, unitPriceCents: 1000, vatRateBp: 2000 },
      { quantity: 1, unitPriceCents: 45050, vatRateBp: 550 },
    ]);
    expect(q.lines.map((l) => l.totalCents)).toEqual([3000, 45050]);
    expect(q.lines.map((l) => l.vatCents)).toEqual([600, 2478]);
    expect(q.subtotalCents).toBe(48050);
    expect(q.vatCents).toBe(3078);
    expect(q.totalCents).toBe(51128);
  });

  it("rounds a line's VAT half up to the cent", () => {
    // 0.10 EUR at 5.5 %: 0.0055 EUR, rounded to 0.01 EUR.
    const q = calculateQuote([{ quantity: 1, unitPriceCents: 10, vatRateBp: 550 }]);
    expect(q.lines[0]?.vatCents).toBe(1);
  });

  it("keeps decimal money exact over many lines", () => {
    const lines = Array.from({ length: 10 }, () => ({
      quantity: 1,
      unitPriceCents: 10,
      vatRateBp: 0,
    }));
    expect(calculateQuote(lines).totalCents).toBe(100);
  });

  it("refuses an empty quote", () => {
    expect(() => calculateQuote([])).toThrow();
  });

  it("refuses a non-positive quantity, a negative price or an unknown VAT rate", () => {
    expect(() => calculateQuote([{ quantity: 0, unitPriceCents: 100, vatRateBp: 0 }])).toThrow();
    expect(() => calculateQuote([{ quantity: 1, unitPriceCents: -1, vatRateBp: 0 }])).toThrow();
    expect(() => calculateQuote([{ quantity: 1, unitPriceCents: 100, vatRateBp: 1234 }])).toThrow();
  });

  it("only offers the French VAT rates", () => {
    expect(VAT_RATES_BP).toEqual([0, 210, 550, 1000, 2000]);
  });
});
