// The payment schedule of a booking. Reads follow visibility; writes follow the deal's edit
// rules, and every settlement is written to the deal's audit trail in the same transaction.
import { and, asc, eq, sql } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { paymentLines } from "@/db/schema/paymentLines";
import { recordChange } from "@/features/collaboration/changeLog";
import { assertDealVisible } from "@/features/deals/assertDealVisible";
import { loadEditableDeal } from "@/features/deals/dealAuth";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import {
  INITIAL_STATUS,
  type PaymentKind,
  type PaymentStatus,
  reopenedStatus,
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
  // The bank statement line that settles this payment, when one was matched with it.
  bankTransactionId: string | null;
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
  const visible = await assertDealVisible(db, actor, dealId, signal);
  if (!visible.ok) return err(visible.error);

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
    bankTransactionId: row.bankTransactionId,
  };
}

// Undoes recordPayment: a payment recorded by mistake, or matched with the wrong bank line,
// goes back to being owed (a released caution goes back to held). The day and the reference
// are cleared with it, and the change is written to the deal's history like any other.
export async function reopenPayment(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  lineId: string,
  signal: AbortSignal,
): Promise<Result<PaymentLineRow, AppError>> {
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(paymentLines)
      .where(and(eq(paymentLines.id, lineId), eq(paymentLines.dealId, dealId)))
      .for("update");
    if (before === undefined) {
      return err(new AppError(ERROR_IDS.PAYMENT_NOT_FOUND, "Payment line not found", { lineId }));
    }
    const next = reopenedStatus(before.kind, before.status);
    if (next === null) {
      return err(
        new AppError(ERROR_IDS.PAYMENT_INVALID, "This line is not settled", {
          status: before.status,
        }),
      );
    }

    const [after] = await tx
      .update(paymentLines)
      // The statement line it was matched with is released too, so it can settle the right
      // payment next time.
      .set({
        status: next,
        paidOn: null,
        reference: null,
        bankTransactionId: null,
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
