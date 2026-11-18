// The rules of the payment schedule (échéancier). Pure: the repo calls these before any write.
import { parseMoneyToCents } from "@/features/quotes/quoteMath";
import { isIsoDay } from "@/features/reservations/reservationRules";
import { err, ok, type Result } from "@/types/result";

export const PAYMENT_KINDS = ["deposit", "balance", "hold"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_STATUSES = ["due", "paid", "held", "released"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// A deposit or balance is owed, then paid. A hold (caution or deposit held against damage) is
// held, then released; it is never counted as income.
export const INITIAL_STATUS: Record<PaymentKind, PaymentStatus> = {
  deposit: "due",
  balance: "due",
  hold: "held",
};

const SETTLEMENT: Record<PaymentKind, { from: PaymentStatus; to: PaymentStatus }> = {
  deposit: { from: "due", to: "paid" },
  balance: { from: "due", to: "paid" },
  hold: { from: "held", to: "released" },
};

// The status a line moves to when its money is recorded, or null when that move is not allowed
// (already paid or released, so a second payment is refused rather than counted twice).
export function settledStatus(kind: PaymentKind, current: PaymentStatus): PaymentStatus | null {
  const rule = SETTLEMENT[kind];
  return rule.from === current ? rule.to : null;
}

// The way back: the status a settled line returns to when a person says the money did not
// actually arrive (or the caution was not actually released). Null for a line never settled.
export function reopenedStatus(kind: PaymentKind, current: PaymentStatus): PaymentStatus | null {
  const rule = SETTLEMENT[kind];
  return rule.to === current ? rule.from : null;
}

export const MAX_PAYMENT_REFERENCE_LENGTH = 200;

// Typed amounts follow French habits ("1 250,00", with a space or narrow no-break space as the
// thousands separator). They are normalised to the strict form the money parser reads, which
// still refuses anything it cannot place exactly.
const THOUSANDS_SEPARATORS = /[\s\u00a0\u202f]/g;
export function parseAmountText(text: string): number | null {
  return parseMoneyToCents(text.replace(THOUSANDS_SEPARATORS, "").replace(",", "."));
}

export type PaymentRuleError = "invalid_kind" | "invalid_amount" | "invalid_date";

export function validateNewLine(input: {
  kind: string;
  amountCents: number;
  dueOn: string;
}): Result<{ kind: PaymentKind; amountCents: number; dueOn: string }, PaymentRuleError> {
  if (!(PAYMENT_KINDS as readonly string[]).includes(input.kind)) return err("invalid_kind");
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) return err("invalid_amount");
  if (!isIsoDay(input.dueOn)) return err("invalid_date");
  return ok({
    kind: input.kind as PaymentKind,
    amountCents: input.amountCents,
    dueOn: input.dueOn,
  });
}

export function validatePayment(input: {
  paidOn: string;
  reference: string | null;
}): Result<{ paidOn: string; reference: string | null }, PaymentRuleError> {
  if (!isIsoDay(input.paidOn)) return err("invalid_date");
  const reference =
    input.reference === null || input.reference.trim() === "" ? null : input.reference.trim();
  if (reference !== null && reference.length > MAX_PAYMENT_REFERENCE_LENGTH)
    return err("invalid_date");
  return ok({ paidOn: input.paidOn, reference });
}

// A line is overdue when it is still owed after its due day: the list of reminders to send.
export function isOverdue(line: { status: string; dueOn: string }, today: string): boolean {
  return line.status === "due" && line.dueOn < today;
}
