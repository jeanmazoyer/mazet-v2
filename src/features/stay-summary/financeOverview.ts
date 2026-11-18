// What the deal's Finance block shows, worked out from the payment schedule: how much has come
// in, where each line stands, and the checks a bookkeeper would run by eye. Pure, so the same
// figures can be tested without a database.
import type { PaymentLineRow } from "@/features/payments/paymentRepo";
import { isOverdue } from "@/features/payments/paymentRules";

export type FinanceLineState = "paid" | "overdue" | "due" | "held" | "released";

export interface FinanceLine extends PaymentLineRow {
  state: FinanceLineState;
  // Money owed to the estate (deposit, balance) vs. a caution held against damage, which is
  // never income and usually a card imprint with no bank movement to look for.
  isIncome: boolean;
  // A received payment tied to the line of the bank statement that proves it. A reference
  // typed by hand is not proof: only the link to a stored statement line counts.
  bankMatched: boolean;
}

export interface FinanceOverview {
  expectedCents: number;
  receivedCents: number;
  lines: FinanceLine[];
  checks: {
    // Null when the deal has no value to compare the schedule with.
    scheduleMatchesDeal: boolean | null;
    nothingOverdue: boolean;
    receivedAllMatched: boolean;
  };
}

function lineState(line: PaymentLineRow, today: string): FinanceLineState {
  if (line.status === "paid" || line.status === "held" || line.status === "released") {
    return line.status;
  }
  return isOverdue(line, today) ? "overdue" : "due";
}

export function buildFinanceOverview(
  payments: readonly PaymentLineRow[],
  dealValueCents: number | null,
  today: string,
): FinanceOverview {
  const lines = payments.map((line) => {
    const isIncome = line.kind !== "hold";
    return {
      ...line,
      state: lineState(line, today),
      isIncome,
      bankMatched: line.status === "paid" && line.bankTransactionId !== null,
    };
  });
  const income = lines.filter((line) => line.isIncome);
  const received = income.filter((line) => line.state === "paid");
  const expectedCents = income.reduce((sum, line) => sum + line.amountCents, 0);
  return {
    expectedCents,
    receivedCents: received.reduce((sum, line) => sum + line.amountCents, 0),
    lines,
    checks: {
      scheduleMatchesDeal: dealValueCents === null ? null : expectedCents === dealValueCents,
      nothingOverdue: lines.every((line) => line.state !== "overdue"),
      receivedAllMatched: received.every((line) => line.bankMatched),
    },
  };
}
