// The documents a booking must hold, and the rules for recording them. Pure: the repo calls
// validatePiecePatch before any write, so the database only ever sees valid values.
import { isIsoDay } from "@/features/reservations/reservationRules";
import { err, ok, type Result } from "@/types/result";

// Order is the order of the checklist on screen.
export const PIECE_KINDS = [
  "quote_sent",
  "contract_signed",
  "deposit_invoice",
  "deposit_received",
  "balance_invoice",
  "balance_received",
  "deposit_hold",
  "insurance_certificate",
] as const;
export type PieceKind = (typeof PIECE_KINDS)[number];

export const PIECE_STATUSES = ["missing", "received", "verified"] as const;
export type PieceStatus = (typeof PIECE_STATUSES)[number];

export const MAX_REFERENCE_LENGTH = 200;

// Only the event insurance certificate has a validity end date: the client must be covered
// until the event, so a received certificate without one is not a usable proof.
const EXPIRY_KINDS: ReadonlySet<PieceKind> = new Set<PieceKind>(["insurance_certificate"]);

export interface PiecePatch {
  kind: PieceKind;
  status: PieceStatus;
  reference: string | null;
  expiresOn: string | null;
}

export type PieceRuleError =
  | "invalid_kind"
  | "invalid_status"
  | "invalid_reference"
  | "invalid_date"
  | "expiry_not_applicable"
  | "expiry_required";

export function validatePiecePatch(input: {
  kind: string;
  status: string;
  reference: string | null;
  expiresOn: string | null;
}): Result<PiecePatch, PieceRuleError> {
  if (!(PIECE_KINDS as readonly string[]).includes(input.kind)) return err("invalid_kind");
  if (!(PIECE_STATUSES as readonly string[]).includes(input.status)) return err("invalid_status");
  const kind = input.kind as PieceKind;
  const status = input.status as PieceStatus;

  const reference = input.reference === null ? null : input.reference.trim();
  if (reference !== null && reference.length > MAX_REFERENCE_LENGTH)
    return err("invalid_reference");

  if (input.expiresOn !== null && !isIsoDay(input.expiresOn)) return err("invalid_date");
  const expiresOn = input.expiresOn;
  if (expiresOn !== null && !EXPIRY_KINDS.has(kind)) return err("expiry_not_applicable");

  const needsExpiry = EXPIRY_KINDS.has(kind) && status !== "missing";
  if (needsExpiry && expiresOn === null) return err("expiry_required");

  return ok({ kind, status, reference: reference === "" ? null : reference, expiresOn });
}
