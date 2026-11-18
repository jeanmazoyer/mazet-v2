// The event sheet of a booking. Reads follow deal visibility, writes follow the deal's edit rules,
// and every change is written to the deal's audit trail in the same transaction.
import { and, asc, eq, sql } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { eventAccommodations, eventProviders, eventSheets } from "@/db/schema/eventSheets";
import { recordChange } from "@/features/collaboration/changeLog";
import { assertDealVisible } from "@/features/deals/assertDealVisible";
import { loadEditableDeal } from "@/features/deals/dealAuth";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import {
  type AccommodationInput,
  type ProviderInput,
  validateAccommodation,
  validateHeadcount,
  validateProvider,
} from "./eventSheetRules";

export interface ProviderRow extends ProviderInput {
  id: string;
}

export interface AccommodationRow extends AccommodationInput {
  id: string;
}

export interface EventSheetView {
  headcount: number | null;
  notes: string | null;
  providers: ProviderRow[];
  accommodations: AccommodationRow[];
}

type ProviderDbRow = typeof eventProviders.$inferSelect;
type AccommodationDbRow = typeof eventAccommodations.$inferSelect;

export async function getEventSheet(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Result<EventSheetView, AppError>> {
  const visible = await assertDealVisible(db, actor, dealId, signal);
  if (!visible.ok) return err(visible.error);
  const [sheet] = await db
    .select()
    .from(eventSheets)
    .where(eq(eventSheets.dealId, dealId))
    .limit(1);
  const providers = await db
    .select()
    .from(eventProviders)
    .where(eq(eventProviders.dealId, dealId))
    .orderBy(asc(eventProviders.createdAt));
  const accommodations = await db
    .select()
    .from(eventAccommodations)
    .where(eq(eventAccommodations.dealId, dealId))
    .orderBy(asc(eventAccommodations.createdAt));
  return ok({
    headcount: sheet?.headcount ?? null,
    notes: sheet?.notes ?? null,
    providers: providers.map(toProvider),
    accommodations: accommodations.map(toAccommodation),
  });
}

export async function saveEventSheet(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  input: { headcount: number | null; notes: string | null },
  signal: AbortSignal,
): Promise<Result<true, AppError>> {
  const headcount = validateHeadcount(input.headcount);
  if (!headcount.ok)
    return err(
      new AppError(ERROR_IDS.EVENT_INVALID, "Check the headcount", { reason: headcount.error }),
    );
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  const notes = input.notes === null || input.notes.trim() === "" ? null : input.notes.trim();
  await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(eventSheets)
      .where(eq(eventSheets.dealId, dealId))
      .for("update");
    await tx
      .insert(eventSheets)
      .values({ dealId, headcount: headcount.value, notes })
      .onConflictDoUpdate({
        target: eventSheets.dealId,
        set: { headcount: headcount.value, notes, updatedAt: sql`now()` },
      });
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: "event:sheet",
        oldValue:
          before === undefined ? null : { headcount: before.headcount, notes: before.notes },
        newValue: { headcount: headcount.value, notes },
        actorId: actor.id,
      },
      signal,
    );
  });
  return ok(true);
}

export async function addProvider(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  input: ProviderInput,
  signal: AbortSignal,
): Promise<Result<ProviderRow, AppError>> {
  const rule = validateProvider(input);
  if (!rule.ok)
    return err(
      new AppError(ERROR_IDS.EVENT_INVALID, "Check the provider's details", { reason: rule.error }),
    );
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  const row = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(eventProviders)
      .values({ dealId, ...rule.value })
      .returning();
    if (inserted === undefined)
      throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "provider insert returned no row");
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: `event:provider:${inserted.id}`,
        oldValue: null,
        newValue: providerState(inserted),
        actorId: actor.id,
      },
      signal,
    );
    return inserted;
  });
  return ok(toProvider(row));
}

export async function removeProvider(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  providerId: string,
  signal: AbortSignal,
): Promise<Result<true, AppError>> {
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(eventProviders)
      .where(and(eq(eventProviders.id, providerId), eq(eventProviders.dealId, dealId)))
      .for("update");
    if (before === undefined)
      return err(new AppError(ERROR_IDS.EVENT_NOT_FOUND, "Provider not found", { providerId }));
    await tx.delete(eventProviders).where(eq(eventProviders.id, providerId));
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: `event:provider:${providerId}`,
        oldValue: providerState(before),
        newValue: null,
        actorId: actor.id,
      },
      signal,
    );
    return ok(true);
  });
}

export async function addAccommodation(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  input: AccommodationInput,
  signal: AbortSignal,
): Promise<Result<AccommodationRow, AppError>> {
  const rule = validateAccommodation(input);
  if (!rule.ok)
    return err(
      new AppError(ERROR_IDS.EVENT_INVALID, "Check the accommodation", { reason: rule.error }),
    );
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  const row = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(eventAccommodations)
      .values({ dealId, ...rule.value })
      .returning();
    if (inserted === undefined)
      throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "accommodation insert returned no row");
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: `event:accommodation:${inserted.id}`,
        oldValue: null,
        newValue: accommodationState(inserted),
        actorId: actor.id,
      },
      signal,
    );
    return inserted;
  });
  return ok(toAccommodation(row));
}

export async function removeAccommodation(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  accommodationId: string,
  signal: AbortSignal,
): Promise<Result<true, AppError>> {
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(eventAccommodations)
      .where(
        and(eq(eventAccommodations.id, accommodationId), eq(eventAccommodations.dealId, dealId)),
      )
      .for("update");
    if (before === undefined)
      return err(
        new AppError(ERROR_IDS.EVENT_NOT_FOUND, "Accommodation not found", { accommodationId }),
      );
    await tx.delete(eventAccommodations).where(eq(eventAccommodations.id, accommodationId));
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: `event:accommodation:${accommodationId}`,
        oldValue: accommodationState(before),
        newValue: null,
        actorId: actor.id,
      },
      signal,
    );
    return ok(true);
  });
}

function providerState(row: ProviderDbRow): Record<string, unknown> {
  return { name: row.name, role: row.role, contact: row.contact, arrivalTime: row.arrivalTime };
}

function accommodationState(row: AccommodationDbRow): Record<string, unknown> {
  return { name: row.name, beds: row.beds, notes: row.notes };
}

function toProvider(row: ProviderDbRow): ProviderRow {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    contact: row.contact,
    arrivalTime: row.arrivalTime,
  };
}

function toAccommodation(row: AccommodationDbRow): AccommodationRow {
  return { id: row.id, name: row.name, beds: row.beds, notes: row.notes };
}
