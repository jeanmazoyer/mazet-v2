// The details the rental contract is generated from. Reads follow deal visibility; the ID number
// is revealed to administrators only, and the audit trail never holds its value.
import { and, asc, eq, sql } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { contractParties, contractTerms } from "@/db/schema/contractData";
import { recordChange } from "@/features/collaboration/changeLog";
import { assertDealVisible } from "@/features/deals/assertDealVisible";
import { loadEditableDeal } from "@/features/deals/dealAuth";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import {
  type ContractTerms,
  type PartyInput,
  type PartyRole,
  validateParty,
  validateTerms,
} from "./contractRules";

export interface PartyView {
  role: PartyRole;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  // Null for everyone but administrators; idNumberOnFile tells the form whether one is stored.
  idNumber: string | null;
  idNumberOnFile: boolean;
}

export interface ContractDataView {
  terms: ContractTerms | null;
  parties: PartyView[];
}

type PartyRow = typeof contractParties.$inferSelect;
type TermsRow = typeof contractTerms.$inferSelect;

export async function getContractData(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Result<ContractDataView, AppError>> {
  const visible = await assertDealVisible(db, actor, dealId, signal);
  if (!visible.ok) return err(visible.error);

  const [terms] = await db
    .select()
    .from(contractTerms)
    .where(eq(contractTerms.dealId, dealId))
    .limit(1);
  const parties = await db
    .select()
    .from(contractParties)
    .where(eq(contractParties.dealId, dealId))
    .orderBy(asc(contractParties.role));
  const revealIdNumbers = actor.type === "admin";
  return ok({
    terms: terms === undefined ? null : toTerms(terms),
    parties: parties.map((row) => toPartyView(row, revealIdNumbers)),
  });
}

export async function saveContractTerms(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  input: { nature: string; occupants: number; arrivalTime: string; departureTime: string },
  signal: AbortSignal,
): Promise<Result<ContractTerms, AppError>> {
  const rule = validateTerms(input);
  if (!rule.ok) {
    return err(
      new AppError(ERROR_IDS.CONTRACT_INVALID, "Check the stay terms", { reason: rule.error }),
    );
  }
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  const terms = rule.value;
  await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(contractTerms)
      .where(eq(contractTerms.dealId, dealId))
      .for("update");
    await tx
      .insert(contractTerms)
      .values({ dealId, ...terms })
      .onConflictDoUpdate({
        target: contractTerms.dealId,
        set: { ...terms, updatedAt: sql`now()` },
      });
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: "contract:terms",
        oldValue: before === undefined ? null : termsState(toTerms(before)),
        newValue: termsState(terms),
        actorId: actor.id,
      },
      signal,
    );
  });
  return ok(terms);
}

export async function saveContractParty(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  role: PartyRole,
  input: PartyInput,
  signal: AbortSignal,
): Promise<Result<PartyView, AppError>> {
  const rule = validateParty(input);
  if (!rule.ok) {
    return err(
      new AppError(ERROR_IDS.CONTRACT_INVALID, "Check the tenant's details", {
        reason: rule.error,
      }),
    );
  }
  // Only an administrator may set or clear the identity number; the rest of the tenant is open to editors.
  if (rule.value.idNumber !== undefined && actor.type !== "admin") {
    return err(
      new AppError(ERROR_IDS.PERM_DENIED, "Only an administrator can change an ID number", {
        dealId,
      }),
    );
  }
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  const party = rule.value;
  const saved = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(contractParties)
      .where(and(eq(contractParties.dealId, dealId), eq(contractParties.role, role)))
      .for("update");
    const idNumber = party.idNumber === undefined ? (existing?.idNumber ?? null) : party.idNumber;
    const values = {
      dealId,
      role,
      fullName: party.fullName,
      email: party.email,
      phone: party.phone,
      address: party.address,
      idNumber,
    };
    const [after] = await tx
      .insert(contractParties)
      .values(values)
      .onConflictDoUpdate({
        target: [contractParties.dealId, contractParties.role],
        set: { ...values, updatedAt: sql`now()` },
      })
      .returning();
    if (after === undefined) {
      throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "contract party upsert returned no row");
    }
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: `contract:party:${role}`,
        oldValue: existing === undefined ? null : partyState(existing),
        newValue: partyState(after),
        actorId: actor.id,
      },
      signal,
    );
    return after;
  });
  return ok(toPartyView(saved, actor.type === "admin"));
}

// The audit records whether an ID number is on file, never the number itself.
function partyState(row: PartyRow): Record<string, unknown> {
  return {
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    address: row.address,
    idNumberOnFile: row.idNumber !== null,
  };
}

function termsState(terms: ContractTerms): Record<string, unknown> {
  return { ...terms };
}

function toTerms(row: TermsRow): ContractTerms {
  return {
    nature: row.nature,
    occupants: row.occupants,
    arrivalTime: row.arrivalTime,
    departureTime: row.departureTime,
  };
}

function toPartyView(row: PartyRow, revealIdNumber: boolean): PartyView {
  return {
    role: row.role,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    address: row.address,
    idNumber: revealIdNumber ? row.idNumber : null,
    idNumberOnFile: row.idNumber !== null,
  };
}
