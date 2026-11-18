// Saves the booking facts edited in the deal's sidebar. Each part goes through the repo that owns
// it (rules, audit trail), inside one transaction: either the whole edit is saved or none of it,
// so a refused change of dates never leaves the terms half updated.
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { AppError } from "@/constants/errorIds";
import type { Db } from "@/db/client";
import { reservations } from "@/db/schema/reservations";
import {
  getContractData,
  saveContractParty,
  saveContractTerms,
} from "@/features/contract-data/contractRepo";
import { CONTRACT_NATURES, PARTY_ROLES } from "@/features/contract-data/contractRules";
import { getEventSheet, saveEventSheet } from "@/features/event-sheet/eventSheetRepo";
import type { PermSetUser } from "@/features/permissions/effective";
import { cancelReservation, createReservation } from "@/features/reservations/reservationRepo";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";

export const stayInput = z.object({
  dealId: z.string().uuid(),
  // Both empty leaves the booked dates alone.
  startDate: z.string().max(10),
  endDate: z.string().max(10),
  nature: z.enum(CONTRACT_NATURES),
  occupants: z.number().int(),
  arrivalTime: z.string().max(5),
  departureTime: z.string().max(5),
  headcount: z.number().int().nullable(),
  // Tenant names in contract order. An empty name leaves that tenant as stored.
  tenants: z.array(z.string().max(120)).max(PARTY_ROLES.length),
});
export type StayInput = z.infer<typeof stayInput>;

// A refused step throws its AppError, which rolls the transaction back.
function must<T>(result: Result<T, AppError>): T {
  if (!result.ok) throw result.error;
  return result.value;
}

async function rebook(
  tx: DbOrTx,
  actor: PermSetUser,
  input: StayInput,
  signal: AbortSignal,
): Promise<void> {
  if (input.startDate === "" && input.endDate === "") return;
  const [current] = await tx
    .select()
    .from(reservations)
    .where(and(eq(reservations.dealId, input.dealId), eq(reservations.state, "active")))
    .orderBy(asc(reservations.startDate))
    .limit(1);
  signal.throwIfAborted();
  if (current?.startDate === input.startDate && current.endDate === input.endDate) return;

  // The old dates are released first so the new ones can overlap them (a stay moved by a day).
  // If the new dates are refused, the rollback brings the old booking back.
  if (current !== undefined) must(await cancelReservation(tx, actor, current.id, signal));
  must(
    await createReservation(
      tx,
      actor,
      {
        dealId: input.dealId,
        startDate: input.startDate,
        endDate: input.endDate,
        kind: current?.kind ?? "firm",
        optionExpiresOn: current?.optionExpiresAt?.toISOString().slice(0, 10) ?? null,
      },
      signal,
    ),
  );
}

async function writeStay(
  tx: DbOrTx,
  actor: PermSetUser,
  input: StayInput,
  signal: AbortSignal,
): Promise<void> {
  const { dealId } = input;
  must(await saveContractTerms(tx, actor, dealId, input, signal));

  const sheet = must(await getEventSheet(tx, actor, dealId, signal));
  if (sheet.headcount !== input.headcount) {
    const next = { headcount: input.headcount, notes: sheet.notes };
    must(await saveEventSheet(tx, actor, dealId, next, signal));
  }

  const contract = must(await getContractData(tx, actor, dealId, signal));
  for (const [index, rawName] of input.tenants.entries()) {
    const role = PARTY_ROLES[index];
    const fullName = rawName.trim();
    if (role === undefined || fullName === "") continue;
    const stored = contract.parties.find((party) => party.role === role);
    if (stored?.fullName === fullName) continue;
    // Only the name is edited here: contact details stay as stored, and an undefined identity
    // number tells the repo to leave the one on file untouched.
    const party = {
      fullName,
      email: stored?.email ?? null,
      phone: stored?.phone ?? null,
      address: stored?.address ?? null,
      idNumber: undefined,
    };
    must(await saveContractParty(tx, actor, dealId, role, party, signal));
  }

  await rebook(tx, actor, input, signal);
}

export async function saveStay(
  db: Db,
  actor: PermSetUser,
  input: StayInput,
  signal: AbortSignal,
): Promise<Result<true, AppError>> {
  try {
    await db.transaction((tx) => writeStay(tx, actor, input, signal));
  } catch (error) {
    if (error instanceof AppError) return err(error);
    throw error;
  }
  return ok(true);
}
