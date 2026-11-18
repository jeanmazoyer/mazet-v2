// The shape of one signed file (a contract and what goes with it) handed to the importer. It is
// the boundary: everything read from a contract passes through here once, and the importer then
// trusts it. The feature repos re-check their own rules (times, identity numbers, amounts).
import { z } from "zod";
import { CONTRACT_NATURES } from "@/features/contract-data/contractRules";
import { PIECE_KINDS, PIECE_STATUSES } from "@/features/deal-pieces/pieceRules";
import { PAYMENT_KINDS } from "@/features/payments/paymentRules";
import { isIsoDay } from "@/features/reservations/reservationRules";

const isoDay = z.string().refine(isIsoDay, "must be a real day written YYYY-MM-DD");
const optionalText = z.string().nullable().default(null);

const tenantSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: optionalText,
  phone: optionalText,
  address: optionalText,
  // Personal data: stored for administrators only, never written to the audit trail.
  idNumber: optionalText,
});

export const dossierSchema = z.object({
  // Where the file comes from (a Drive folder id, say). The same id is never imported twice.
  externalId: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(255),
  status: z.enum(["open", "won"]),
  amountCents: z.number().int().nonnegative(),
  signedOn: isoDay.nullable().default(null),
  nature: z.enum(CONTRACT_NATURES),
  stay: z.object({
    startDate: isoDay,
    endDate: isoDay,
    arrivalTime: z.string(),
    departureTime: z.string(),
    occupants: z.number().int(),
  }),
  headcount: z.number().int().positive().nullable().default(null),
  // The contract names one or two tenants; the first one becomes the deal's contact.
  tenants: z.array(tenantSchema).min(1).max(2),
  payments: z
    .array(
      z.object({
        kind: z.enum(PAYMENT_KINDS),
        amountCents: z.number().int().positive(),
        dueOn: isoDay,
        // Set when the bank statement already shows the money: the line is imported as settled,
        // with the statement's wording as its reference.
        paidOn: isoDay.nullable().default(null),
        reference: optionalText,
      }),
    )
    .default([]),
  pieces: z
    .array(
      z.object({
        kind: z.enum(PIECE_KINDS),
        status: z.enum(PIECE_STATUSES),
        reference: optionalText,
      }),
    )
    .default([]),
  // Files of the dossier that already live in Drive, attached to the deal by reference.
  documents: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(255),
        driveFileId: z.string().trim().min(1).max(200),
        mimeType: z.string().trim().min(1).max(120),
        // True for a file showing identity numbers (the signed contract): administrators only.
        adminOnly: z.boolean().default(false),
      }),
    )
    .default([]),
  note: z.string().trim().min(1).max(5000).nullable().default(null),
});

export type Dossier = z.infer<typeof dossierSchema>;
export type DossierTenant = Dossier["tenants"][number];
