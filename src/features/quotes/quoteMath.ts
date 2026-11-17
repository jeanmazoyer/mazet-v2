// Exact quote arithmetic. Amounts are whole cents; VAT rates are basis points (5.5 % = 550).
// Every rounding is half up on an integer, so the same quote always gives the same totals.

// French VAT rates: 0 %, 2.1 %, 5.5 %, 10 %, 20 %.
export const VAT_RATES_BP = [0, 210, 550, 1000, 2000] as const;
export type VatRateBp = (typeof VAT_RATES_BP)[number];

export interface QuoteLineInput {
  quantity: number;
  unitPriceCents: number;
  vatRateBp: number;
}

export interface QuoteLineTotals extends QuoteLineInput {
  totalCents: number;
  vatCents: number;
}

export interface QuoteTotals {
  lines: QuoteLineTotals[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
}

const DECIMAL = /^\d+(\.\d{1,2})?$/;

// "1234.50" -> 123450. Anything else (negative, comma, letters) is refused rather than guessed.
export function parseMoneyToCents(value: string): number | null {
  if (!DECIMAL.test(value.trim())) return null;
  const [whole = "0", fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function assertLine(line: QuoteLineInput): void {
  if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
    throw new RangeError("quantity must be a positive whole number");
  }
  if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
    throw new RangeError("unit price must be a whole number of cents, zero or more");
  }
  if (!(VAT_RATES_BP as readonly number[]).includes(line.vatRateBp)) {
    throw new RangeError("VAT rate is not one of the French rates");
  }
}

export function calculateQuote(lines: readonly QuoteLineInput[]): QuoteTotals {
  if (lines.length === 0) throw new RangeError("a quote needs at least one line");
  const computed = lines.map((line) => {
    assertLine(line);
    const totalCents = line.quantity * line.unitPriceCents;
    // (total * rate) / 10000, rounded half up to the cent, on integers only.
    const vatCents = Math.floor((totalCents * line.vatRateBp + 5000) / 10000);
    return { ...line, totalCents, vatCents };
  });
  const subtotalCents = computed.reduce((sum, l) => sum + l.totalCents, 0);
  const vatCents = computed.reduce((sum, l) => sum + l.vatCents, 0);
  return { lines: computed, subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}
