// Pure rules for a booking of the estate's dates. No database here: the same checks run on the
// server before any write, and the database constraint is the final guard against overlaps.
import { err, ok, type Result } from "@/types/result";

export const RESERVATION_KINDS = ["option", "firm"] as const;
export type ReservationKind = (typeof RESERVATION_KINDS)[number];

export interface ReservationDraft {
  startDate: string;
  endDate: string;
  kind: ReservationKind;
  // The day an option lapses (inclusive). Only meaningful for an option.
  optionExpiresOn: string | null;
}

export interface ValidReservation {
  startDate: string;
  endDate: string;
  kind: ReservationKind;
  optionExpiresAt: Date | null;
}

export type ReservationRuleError =
  | "invalid_date"
  | "end_before_start"
  | "option_needs_expiry"
  | "option_expiry_in_past";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// A real calendar day in YYYY-MM-DD form. The round trip rejects 2027-02-31 and similar.
export function isIsoDay(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DAY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateReservation(
  draft: ReservationDraft,
  now: Date,
): Result<ValidReservation, ReservationRuleError> {
  if (!isIsoDay(draft.startDate) || !isIsoDay(draft.endDate)) return err("invalid_date");
  if (draft.endDate < draft.startDate) return err("end_before_start");

  if (draft.kind === "firm") {
    // A firm booking never lapses, so an expiry supplied with it is dropped rather than stored.
    return ok({
      startDate: draft.startDate,
      endDate: draft.endDate,
      kind: "firm",
      optionExpiresAt: null,
    });
  }

  if (!isIsoDay(draft.optionExpiresOn)) return err("option_needs_expiry");
  // An option holds its dates until the end of its expiry day (UTC, like the rest of the calendar).
  const optionExpiresAt = new Date(`${draft.optionExpiresOn}T23:59:59.999Z`);
  if (optionExpiresAt.getTime() <= now.getTime()) return err("option_expiry_in_past");

  return ok({
    startDate: draft.startDate,
    endDate: draft.endDate,
    kind: "option",
    optionExpiresAt,
  });
}
