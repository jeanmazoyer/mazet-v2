// The rules of the payment schedule (échéancier). Pure: the repo calls these before any write.
import { isIsoDay } from "@/features/reservations/reservationRules";
import { err, ok, type Result } from "@/types/result";

export const PAYMENT_KINDS = ["deposit", "balance", "hold"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_STATUSES = ["due", "paid", "held", "released"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// A deposit or balance is paid once. A hold (caution, a card pre-authorisation or a deposit held
// against damage) is held, then released; it is never counted as income.
const NEXT: Record<PaymentKind, PaymentStatus[]> = {
  deposit: ["paid"],
  balance: ["paid"],
  hold: ["released"],
};
export const nextStatuses = (kind: PaymentKind): PaymentStatus[] => NEXT[kind];

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
  return ok({ paidOn: input.paidOn, reference });
}

// A line is overdue when it is still owed after its due day: the list of reminders to send.
export function isOverdue(line: { status: string; dueOn: string }, today: string): boolean {
  return line.status === "due" && line.dueOn < today;
}
