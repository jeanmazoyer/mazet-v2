// Turns one signed file into a complete deal: contact, deal, booked dates, contract data,
// headcount, payment schedule and document checklist. Every part goes through the same repo a
// person would use on screen, so the usual rules and the audit trail apply to imported data too.
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import type { Db } from "@/db/client";
import { users } from "@/db/schema";
import { deals } from "@/db/schema/deals";
import { pipelines } from "@/db/schema/pipelines";
import { stages } from "@/db/schema/stages";
import { recordChange } from "@/features/collaboration/changeLog";
import { createNote } from "@/features/collaboration/notesRepo";
import { saveContractParty, saveContractTerms } from "@/features/contract-data/contractRepo";
import { PARTY_ROLES } from "@/features/contract-data/contractRules";
import { updateDealPiece } from "@/features/deal-pieces/pieceRepo";
import { createDeal } from "@/features/deals/dealActions";
import { saveEventSheet } from "@/features/event-sheet/eventSheetRepo";
import { addPaymentLine, recordPayment } from "@/features/payments/paymentRepo";
import { createReservation } from "@/features/reservations/reservationRepo";
import type { HydratedActor } from "@/server/hydrateActor";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import { findOrCreateContact } from "./dossierContact";
import { type Dossier, dossierSchema } from "./dossierSchema";

export interface ImportedDossier {
  dealId: string;
  // False when the file was already imported: nothing was written.
  created: boolean;
}

// A failed step throws its AppError to roll the whole transaction back: a file is imported
// completely or not at all, never left as a deal without its booking or its schedule.
function must<T>(result: Result<T, AppError>): T {
  if (!result.ok) throw result.error;
  return result.value;
}

async function targetStage(
  db: Db,
  status: Dossier["status"],
  signal: AbortSignal,
): Promise<Result<{ pipelineId: string; stageId: string }, AppError>> {
  const [pipeline] = await db
    .select({ id: pipelines.id })
    .from(pipelines)
    .where(eq(pipelines.isArchived, false))
    .orderBy(asc(pipelines.order), asc(pipelines.createdAt))
    .limit(1);
  signal.throwIfAborted();
  // A won file belongs at the end of the pipeline, an open one at its start.
  const [stage] =
    pipeline === undefined
      ? []
      : await db
          .select({ id: stages.id })
          .from(stages)
          .where(eq(stages.pipelineId, pipeline.id))
          .orderBy(status === "won" ? desc(stages.order) : asc(stages.order))
          .limit(1);
  signal.throwIfAborted();
  if (pipeline === undefined || stage === undefined) {
    return err(new AppError(ERROR_IDS.IMPORT_DOSSIER_NO_STAGE, "No pipeline stage to import into"));
  }
  return ok({ pipelineId: pipeline.id, stageId: stage.id });
}

interface DossierTarget {
  pipelineId: string;
  stageId: string;
  personId: string;
  // Where a deal goes when deals default to group visibility: the importing administrator's own
  // group, exactly as if they had created the deal on screen.
  primaryGroupId: string | null;
}

async function writeDossier(
  tx: DbOrTx,
  actor: HydratedActor,
  dossier: Dossier,
  target: DossierTarget,
  signal: AbortSignal,
): Promise<string> {
  const deal = must(
    await createDeal(
      tx,
      {
        userId: actor.id,
        isAdmin: true,
        isActive: true,
        sessionLive: true,
        visibilityGroupIds: [...actor.groupIds],
        primaryVisibilityGroupId: target.primaryGroupId,
        flags: {},
      },
      {
        title: dossier.title,
        value: dossier.amountCents / 100,
        pipelineId: target.pipelineId,
        stageId: target.stageId,
        personId: target.personId,
        expectedCloseDate: dossier.stay.startDate,
        sourceChannelId: dossier.externalId,
      },
      signal,
    ),
  );
  const dealId = deal.id;

  if (dossier.status === "won") {
    // The day it was signed, not the day it was imported, so the yearly figures stay true.
    const wonTime =
      dossier.signedOn === null ? new Date() : new Date(`${dossier.signedOn}T12:00:00Z`);
    await tx.update(deals).set({ status: "won", wonTime }).where(eq(deals.id, dealId));
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: "status",
        oldValue: "open",
        newValue: "won",
        actorId: actor.id,
      },
      signal,
    );
  }

  must(
    await createReservation(
      tx,
      actor,
      {
        dealId,
        startDate: dossier.stay.startDate,
        endDate: dossier.stay.endDate,
        kind: "firm",
        optionExpiresOn: null,
      },
      signal,
    ),
  );
  must(
    await saveContractTerms(
      tx,
      actor,
      dealId,
      {
        nature: dossier.nature,
        occupants: dossier.stay.occupants,
        arrivalTime: dossier.stay.arrivalTime,
        departureTime: dossier.stay.departureTime,
      },
      signal,
    ),
  );
  for (const [index, tenant] of dossier.tenants.entries()) {
    const role = PARTY_ROLES[index];
    if (role === undefined) break;
    must(await saveContractParty(tx, actor, dealId, role, tenant, signal));
  }
  if (dossier.headcount !== null) {
    must(
      await saveEventSheet(
        tx,
        actor,
        dealId,
        { headcount: dossier.headcount, notes: null },
        signal,
      ),
    );
  }
  for (const line of dossier.payments) {
    const added = must(await addPaymentLine(tx, actor, dealId, line, signal));
    if (line.paidOn !== null) {
      const settlement = { paidOn: line.paidOn, reference: line.reference };
      must(await recordPayment(tx, actor, dealId, added.id, settlement, signal));
    }
  }
  for (const piece of dossier.pieces) {
    must(await updateDealPiece(tx, actor, dealId, { ...piece, expiresOn: null }, signal));
  }
  return dealId;
}

export async function importDossier(
  db: Db,
  actor: HydratedActor,
  raw: unknown,
  signal: AbortSignal,
): Promise<Result<ImportedDossier, AppError>> {
  if (actor.type !== "admin") {
    return err(
      new AppError(ERROR_IDS.PERM_DENIED, "Only an administrator can import files", {
        userId: actor.id,
      }),
    );
  }
  const parsed = dossierSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      new AppError(ERROR_IDS.IMPORT_DOSSIER_INVALID, "The file is incomplete or malformed", {
        issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      }),
    );
  }
  const dossier = parsed.data;

  const [already] = await db
    .select({ id: deals.id })
    .from(deals)
    .where(and(eq(deals.sourceChannelId, dossier.externalId), isNull(deals.deletedAt)))
    .limit(1);
  signal.throwIfAborted();
  if (already !== undefined) return ok({ dealId: already.id, created: false });

  const stage = await targetStage(db, dossier.status, signal);
  if (!stage.ok) return stage;
  const [firstTenant] = dossier.tenants;
  if (firstTenant === undefined) {
    throw new AppError(ERROR_IDS.DB_INVARIANT, "importDossier: schema guarantees one tenant");
  }
  const contact = await findOrCreateContact(db, actor, firstTenant, signal);
  if (!contact.ok) return contact;

  const [owner] = await db
    .select({ primaryGroup: users.primaryVisibilityGroupId })
    .from(users)
    .where(eq(users.id, actor.id));
  signal.throwIfAborted();

  let dealId: string;
  try {
    dealId = await db.transaction((tx) =>
      writeDossier(
        tx,
        actor,
        dossier,
        { ...stage.value, personId: contact.value, primaryGroupId: owner?.primaryGroup ?? null },
        signal,
      ),
    );
  } catch (error) {
    if (error instanceof AppError) return err(error);
    throw error;
  }

  if (dossier.note !== null) {
    const note = await createNote(
      db,
      actor,
      { entityType: "deal", entityId: dealId, body: dossier.note, pinned: false },
      signal,
    );
    if (!note.ok) return err(note.error);
  }
  return ok({ dealId, created: true });
}
