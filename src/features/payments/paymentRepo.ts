// The payment schedule of a booking. Reads follow visibility; writes follow the deal's edit
// rules, and every settlement is written to the deal's audit trail in the same transaction.
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { deals } from "@/db/schema/deals";
import { paymentLines } from "@/db/schema/paymentLines";
import { pipelines } from "@/db/schema/pipelines";
import { recordChange } from "@/features/collaboration/changeLog";
import { loadEditableDeal, toVisibleDeal } from "@/features/deals/dealAuth";
import { canSee } from "@/features/permissions/canSee";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import {
  INITIAL_STATUS,
  type PaymentKind,
  type PaymentStatus,
  settledStatus,
  validateNewLine,
  validatePayment,
} from "./paymentRules";

export interface PaymentLineRow {
  id: string;
  kind: PaymentKind;
  status: PaymentStatus;
  amountCents: number;
  dueOn: string;
  paidOn: string | null;
  reference: string | null;
}

export interface NewPaymentLine {
  kind: string;
  amountCents: number;
  dueOn: string;
}

export interface PaymentSettlement {
  paidOn: string;
  reference: string | null;
}

type LineRow = typeof paymentLines.$inferSelect;

export async function listPaymentLines(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Result<PaymentLineRow[], AppError>> {
  const [deal] = await db
    .select({
      id: deals.id,
      ownerId: deals.ownerId,
      visibilityLevel: deals.visibilityLevel,
      visibilityGroupId: deals.visibilityGroupId,
      visibleToUserIds: deals.visibleToUserIds,
      pipelineVisibilityGroupId: pipelines.visibilityGroupId,
    })
    .from(deals)
    .innerJoin(pipelines, eq(pipelines.id, deals.pipelineId))
    .where(and(eq(deals.id, dealId), isNull(deals.deletedAt), eq(pipelines.isArchived, false)))
    .limit(1);
  if (deal === undefined || !canSee(actor, toVisibleDeal(deal, deal.pipelineVisibilityGroupId))) {
    return err(new AppError(ERROR_IDS.DEAL_NOT_FOUND, "Deal not found or not visible", { dealId }));
  }
  signal.throwIfAborted();

  const rows = await db
    .select()
    .from(paymentLines)
    .where(eq(paymentLines.dealId, dealId))
    .orderBy(asc(paymentLines.dueOn), asc(paymentLines.createdAt));
  return ok(rows.map(toRow));
}

export async function addPaymentLine(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  input: NewPaymentLine,
  signal: AbortSignal,
): Promise<Result<PaymentLineRow, AppError>> {
  const rule = validateNewLine(input);
  if (!rule.ok) {
    return err(
      new AppError(ERROR_IDS.PAYMENT_INVALID, "Check the amount and due day", {
        reason: rule.error,
      }),
    );
  }
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  const line = rule.value;
  const row = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(paymentLines)
      .values({
        dealId,
        kind: line.kind,
        status: INITIAL_STATUS[line.kind],
        amountCents: line.amountCents,
        dueOn: line.dueOn,
      })
      .returning();
    if (inserted === undefined) {
      throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "payment line insert returned no row");
    }
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: `payment:${inserted.id}`,
        oldValue: null,
        newValue: lineState(inserted),
        actorId: actor.id,
      },
      signal,
    );
    return inserted;
  });
  return ok(toRow(row));
}

export async function recordPayment(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  lineId: string,
  input: PaymentSettlement,
  signal: AbortSignal,
): Promise<Result<PaymentLineRow, AppError>> {
  const rule = validatePayment(input);
  if (!rule.ok) {
    return err(
      new AppError(ERROR_IDS.PAYMENT_INVALID, "Check the date received", { reason: rule.error }),
    );
  }
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  const settlement = rule.value;
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(paymentLines)
      .where(and(eq(paymentLines.id, lineId), eq(paymentLines.dealId, dealId)))
      .for("update");
    if (before === undefined) {
      return err(new AppError(ERROR_IDS.PAYMENT_NOT_FOUND, "Payment line not found", { lineId }));
    }
    const next = settledStatus(before.kind, before.status);
    if (next === null) {
      return err(
        new AppError(ERROR_IDS.PAYMENT_INVALID, "This line is already settled", {
          status: before.status,
        }),
      );
    }

    const [after] = await tx
      .update(paymentLines)
      .set({
        status: next,
        paidOn: settlement.paidOn,
        reference: settlement.reference,
        updatedAt: sql`now()`,
      })
      .where(eq(paymentLines.id, lineId))
      .returning();
    if (after === undefined) {
      throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "payment line update returned no row");
    }
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: `payment:${lineId}`,
        oldValue: lineState(before),
        newValue: lineState(after),
        actorId: actor.id,
      },
      signal,
    );
    return ok(toRow(after));
  });
}

function lineState(row: LineRow): Record<string, unknown> {
  return {
    kind: row.kind,
    status: row.status,
    amountCents: row.amountCents,
    dueOn: row.dueOn,
    paidOn: row.paidOn,
    reference: row.reference,
  };
}

function toRow(row: LineRow): PaymentLineRow {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    amountCents: row.amountCents,
    dueOn: row.dueOn,
    paidOn: row.paidOn,
    reference: row.reference,
  };
}
