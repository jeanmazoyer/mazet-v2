// Rules for the event sheet: the headcount, the providers and the accommodations of a booking.
import { err, ok, type Result } from "@/types/result";

export const MAX_HEADCOUNT = 1000;
export const MAX_BEDS = 200;
const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export type SheetRuleError =
  | "invalid_headcount"
  | "invalid_name"
  | "invalid_role"
  | "invalid_contact"
  | "invalid_time"
  | "invalid_beds";

export function validateHeadcount(value: number | null): Result<number | null, SheetRuleError> {
  if (value === null) return ok(null);
  if (!Number.isInteger(value) || value < 1 || value > MAX_HEADCOUNT)
    return err("invalid_headcount");
  return ok(value);
}

export interface ProviderInput {
  name: string;
  role: string;
  contact: string | null;
  arrivalTime: string | null;
}

export function validateProvider(input: ProviderInput): Result<ProviderInput, SheetRuleError> {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 120) return err("invalid_name");
  const role = input.role.trim();
  if (role.length < 2 || role.length > 80) return err("invalid_role");
  const contact = blankToNull(input.contact);
  if (contact !== null && contact.length > 200) return err("invalid_contact");
  const arrivalTime = blankToNull(input.arrivalTime);
  if (arrivalTime !== null && !CLOCK_TIME.test(arrivalTime)) return err("invalid_time");
  return ok({ name, role, contact, arrivalTime });
}

export interface AccommodationInput {
  name: string;
  beds: number | null;
  notes: string | null;
}

export function validateAccommodation(
  input: AccommodationInput,
): Result<AccommodationInput, SheetRuleError> {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 120) return err("invalid_name");
  if (
    input.beds !== null &&
    (!Number.isInteger(input.beds) || input.beds < 1 || input.beds > MAX_BEDS)
  ) {
    return err("invalid_beds");
  }
  return ok({ name, beds: input.beds, notes: blankToNull(input.notes) });
}

function blankToNull(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
