// The checklist of documents attached to a deal. Reads and writes go through the same deal
// rules as the rest of the deal (visibility, then edit), and every change is written to the
// deal's audit trail in the same transaction.
import { and, eq, sql } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { dealPieces } from "@/db/schema/dealPieces";
import { recordChange } from "@/features/collaboration/changeLog";
import { assertDealVisible } from "@/features/deals/assertDealVisible";
import { loadEditableDeal } from "@/features/deals/dealAuth";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import { PIECE_KINDS, type PieceKind, type PieceStatus, validatePiecePatch } from "./pieceRules";

export interface PieceRow {
  kind: PieceKind;
  status: PieceStatus;
  reference: string | null;
  expiresOn: string | null;
  updatedAt: Date;
}

export interface PieceUpdate {
  kind: string;
  status: string;
  reference: string | null;
  expiresOn: string | null;
}

// Adds any missing document rows; existing ones (and their status) are left alone.
export async function ensureDealPieces(db: DbOrTx, dealId: string): Promise<void> {
  await db
    .insert(dealPieces)
    .values(PIECE_KINDS.map((kind) => ({ dealId, kind })))
    .onConflictDoNothing();
}

export async function listDealPieces(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Result<PieceRow[], AppError>> {
  const visible = await assertDealVisible(db, actor, dealId, signal);
  if (!visible.ok) return err(visible.error);

  await ensureDealPieces(db, dealId);
  const rows = await db.select().from(dealPieces).where(eq(dealPieces.dealId, dealId));
  return ok(sortByChecklist(rows));
}

export async function updateDealPiece(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  input: PieceUpdate,
  signal: AbortSignal,
): Promise<Result<PieceRow, AppError>> {
  const rule = validatePiecePatch(input);
  if (!rule.ok) {
    return err(
      new AppError(ERROR_IDS.PIECE_INVALID, "Check the document's status and details", {
        reason: rule.error,
      }),
    );
  }

  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  await ensureDealPieces(db, dealId);
  const patch = rule.value;

  const row = await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(dealPieces)
      .where(and(eq(dealPieces.dealId, dealId), eq(dealPieces.kind, patch.kind)))
      .for("update");
    const [after] = await tx
      .update(dealPieces)
      .set({
        status: patch.status,
        reference: patch.reference,
        expiresOn: patch.expiresOn,
        updatedAt: sql`now()`,
      })
      .where(and(eq(dealPieces.dealId, dealId), eq(dealPieces.kind, patch.kind)))
      .returning();
    if (after === undefined) {
      throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "piece update returned no row");
    }

    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: `piece:${patch.kind}`,
        oldValue: before === undefined ? null : pieceState(before),
        newValue: pieceState(after),
        actorId: actor.id,
      },
      signal,
    );
    return after;
  });
  return ok(toRow(row));
}

function pieceState(row: typeof dealPieces.$inferSelect): Record<string, unknown> {
  return { status: row.status, reference: row.reference, expiresOn: row.expiresOn };
}

function toRow(row: typeof dealPieces.$inferSelect): PieceRow {
  return {
    kind: row.kind,
    status: row.status,
    reference: row.reference,
    expiresOn: row.expiresOn,
    updatedAt: row.updatedAt,
  };
}

function sortByChecklist(rows: Array<typeof dealPieces.$inferSelect>): PieceRow[] {
  const position = new Map(PIECE_KINDS.map((kind, index) => [kind, index]));
  return rows.map(toRow).sort((a, b) => (position.get(a.kind) ?? 0) - (position.get(b.kind) ?? 0));
}
