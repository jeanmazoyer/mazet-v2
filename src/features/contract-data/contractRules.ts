// What the rental contract needs to know, checked before anything is saved.
import { err, ok, type Result } from "@/types/result";

export const CONTRACT_NATURES = ["stay", "event"] as const;
export type ContractNature = (typeof CONTRACT_NATURES)[number];

// The contract names two tenants at most (the couple or the two lead guests).
export const PARTY_ROLES = ["tenant_1", "tenant_2"] as const;
export type PartyRole = (typeof PARTY_ROLES)[number];

export const MAX_OCCUPANTS = 500;
const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Identity numbers are letters and digits only (CNI, passport). Spaces are dropped on entry.
const ID_NUMBER = /^[A-Z0-9]{5,20}$/;

export interface ContractTerms {
  nature: ContractNature;
  occupants: number;
  arrivalTime: string;
  departureTime: string;
}

export type TermsRuleError = "invalid_nature" | "invalid_occupants" | "invalid_time";

export function validateTerms(input: {
  nature: string;
  occupants: number;
  arrivalTime: string;
  departureTime: string;
}): Result<ContractTerms, TermsRuleError> {
  if (!(CONTRACT_NATURES as readonly string[]).includes(input.nature)) return err("invalid_nature");
  if (
    !Number.isInteger(input.occupants) ||
    input.occupants < 1 ||
    input.occupants > MAX_OCCUPANTS
  ) {
    return err("invalid_occupants");
  }
  if (!CLOCK_TIME.test(input.arrivalTime) || !CLOCK_TIME.test(input.departureTime))
    return err("invalid_time");
  return ok({
    nature: input.nature as ContractNature,
    occupants: input.occupants,
    arrivalTime: input.arrivalTime,
    departureTime: input.departureTime,
  });
}

export interface PartyInput {
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  // undefined means "leave the stored number as it is"; null clears it.
  idNumber?: string | null;
}

export type PartyRuleError = "invalid_name" | "invalid_email" | "invalid_id_number";

export function validateParty(input: PartyInput): Result<PartyInput, PartyRuleError> {
  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 120) return err("invalid_name");
  const email = blankToNull(input.email);
  if (email !== null && !EMAIL.test(email)) return err("invalid_email");
  let idNumber: string | null | undefined;
  if (input.idNumber === undefined) {
    idNumber = undefined;
  } else if (input.idNumber === null || input.idNumber.trim() === "") {
    idNumber = null;
  } else {
    idNumber = input.idNumber.replace(/\s+/g, "").toUpperCase();
    if (!ID_NUMBER.test(idNumber)) return err("invalid_id_number");
  }
  return ok({
    fullName,
    email,
    phone: blankToNull(input.phone),
    address: blankToNull(input.address),
    idNumber,
  });
}

function blankToNull(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
