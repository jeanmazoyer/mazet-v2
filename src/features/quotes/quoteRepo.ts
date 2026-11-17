// The price grid and the quotes made from it. A quote copies its prices at creation; its totals
// come from quoteMath, never from the client. Every write goes through the deal's own rules
// (visibility, then edit) and is recorded in the deal's audit trail.
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { deals } from "@/db/schema/deals";
import { pipelines } from "@/db/schema/pipelines";
import { priceItems, quoteLines, quotes } from "@/db/schema/quotes";
import { recordChange } from "@/features/collaboration/changeLog";
import { loadEditableDeal, toVisibleDeal } from "@/features/deals/dealAuth";
import { canSee } from "@/features/permissions/canSee";
import type { PermSetUser } from "@/features/permissions/effective";
import { isIsoDay } from "@/features/reservations/reservationRules";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import { calculateQuote, VAT_RATES_BP } from "./quoteMath";

export type QuoteLanguage = "fr" | "en";
export type QuoteStatus = "draft" | "sent" | "accepted";
export type PriceUnit = "flat" | "per_day" | "per_person";

export interface PriceItemRow {
  id: string;
  labelFr: string;
  labelEn: string;
  unit: PriceUnit;
  unitPriceCents: number;
  vatRateBp: number;
  active: boolean;
}

export interface PriceItemInput {
  id?: string;
  labelFr: string;
  labelEn: string;
  unit: PriceUnit;
  unitPriceCents: number;
  vatRateBp: number;
  active: boolean;
}

export interface QuoteInput {
  language: QuoteLanguage;
  validUntil: string | null;
  notes: string | null;
  lines: Array<{ priceItemId: string; quantity: number }>;
}

export interface QuoteRow {
  id: string;
  dealId: string;
  version: number;
  status: QuoteStatus;
  language: QuoteLanguage;
  validUntil: string | null;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  createdAt: Date;
}

const MAX_LINES = 50;
const MAX_QUANTITY = 1000;
const MAX_LABEL = 120;
const MAX_NOTES = 2000;
const UNITS: readonly PriceUnit[] = ["flat", "per_day", "per_person"];

const invalid = (why: string): AppError => new AppError(ERROR_IDS.QUOTE_INVALID, why);

// The grid is readable by whoever can build a quote: admins and anyone who may create deals.
export function canReadPriceGrid(actor: PermSetUser): boolean {
  return actor.type === "admin" || actor.flags.has("deal.create");
}

export async function listPriceItems(
  db: DbOrTx,
  actor: PermSetUser,
  signal: AbortSignal,
): Promise<PriceItemRow[]> {
  if (!canReadPriceGrid(actor)) return [];
  const rows = await db.select().from(priceItems).where(eq(priceItems.active, true));
  signal.throwIfAborted();
  return rows.map(toPriceItem);
}

// The full grid, inactive prices included, for the administrator who maintains it.
export async function listAllPriceItems(
  db: DbOrTx,
  actor: PermSetUser,
  signal: AbortSignal,
): Promise<PriceItemRow[]> {
  if (actor.type !== "admin") return [];
  const rows = await db.select().from(priceItems).orderBy(priceItems.labelFr);
  signal.throwIfAborted();
  return rows.map(toPriceItem);
}

export async function upsertPriceItem(
  db: DbOrTx,
  actor: PermSetUser,
  input: PriceItemInput,
  signal: AbortSignal,
): Promise<Result<PriceItemRow, AppError>> {
  if (actor.type !== "admin") {
    return err(new AppError(ERROR_IDS.PERM_DENIED, "Only an administrator changes the price grid"));
  }
  if (
    input.labelFr.trim() === "" ||
    input.labelEn.trim() === "" ||
    input.labelFr.length > MAX_LABEL ||
    input.labelEn.length > MAX_LABEL
  ) {
    return err(invalid("Each price needs a label in French and in English"));
  }
  if (!Number.isInteger(input.unitPriceCents) || input.unitPriceCents < 0) {
    return err(invalid("The price must be zero or more"));
  }
  if (!(VAT_RATES_BP as readonly number[]).includes(input.vatRateBp)) {
    return err(invalid("The VAT rate is not a French rate"));
  }
  if (!(UNITS as readonly string[]).includes(input.unit)) return err(invalid("Unknown unit"));

  const values = {
    labelFr: input.labelFr.trim(),
    labelEn: input.labelEn.trim(),
    unit: input.unit,
    unitPriceCents: input.unitPriceCents,
    vatRateBp: input.vatRateBp,
    active: input.active,
    updatedAt: sql`now()`,
  };
  signal.throwIfAborted();
  const [row] =
    input.id === undefined
      ? await db.insert(priceItems).values(values).returning()
      : await db.update(priceItems).set(values).where(eq(priceItems.id, input.id)).returning();
  if (row === undefined) return err(new AppError(ERROR_IDS.QUOTE_NOT_FOUND, "Price not found"));
  return ok(toPriceItem(row));
}

export async function createQuote(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  input: QuoteInput,
  signal: AbortSignal,
): Promise<Result<QuoteRow, AppError>> {
  if (input.lines.length === 0 || input.lines.length > MAX_LINES)
    return err(invalid("A quote has between 1 and 50 lines"));
  if (
    input.lines.some(
      (l) => !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > MAX_QUANTITY,
    )
  ) {
    return err(invalid("Each quantity is a whole number from 1 to 1000"));
  }
  if (input.validUntil !== null && !isIsoDay(input.validUntil))
    return err(invalid("The validity date is not valid"));
  if (input.notes !== null && input.notes.length > MAX_NOTES)
    return err(invalid("The notes are too long"));

  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  const ids = [...new Set(input.lines.map((l) => l.priceItemId))];
  const items = await db
    .select()
    .from(priceItems)
    .where(and(inArray(priceItems.id, ids), eq(priceItems.active, true)));
  if (items.length !== ids.length)
    return err(invalid("A line uses a price that does not exist or is no longer offered"));
  const byId = new Map(items.map((i) => [i.id, i]));

  const priced = input.lines.map((l) => {
    const item = byId.get(l.priceItemId);
    if (item === undefined)
      throw new AppError(ERROR_IDS.QUOTE_INVALID, "price item vanished between two reads");
    return {
      item,
      quantity: l.quantity,
      unitPriceCents: item.unitPriceCents,
      vatRateBp: item.vatRateBp,
    };
  });
  const totals = calculateQuote(
    priced.map((p) => ({
      quantity: p.quantity,
      unitPriceCents: p.unitPriceCents,
      vatRateBp: p.vatRateBp,
    })),
  );
  signal.throwIfAborted();

  const row = await db.transaction(async (tx) => {
    // Lock the deal row first: two quotes for one deal are then numbered one after the other,
    // instead of both reading the same latest version.
    await tx.select({ id: deals.id }).from(deals).where(eq(deals.id, dealId)).for("update");
    const [latest] = await tx
      .select({ next: sql<number>`coalesce(max(${quotes.version}), 0) + 1` })
      .from(quotes)
      .where(eq(quotes.dealId, dealId));
    const next = latest?.next ?? 1;
    const [quote] = await tx
      .insert(quotes)
      .values({
        dealId,
        version: Number(next),
        language: input.language,
        validUntil: input.validUntil,
        notes: input.notes,
        subtotalCents: totals.subtotalCents,
        vatCents: totals.vatCents,
        totalCents: totals.totalCents,
        createdById: actor.id,
      })
      .returning();
    if (quote === undefined)
      throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "quote insert returned no row");

    await tx.insert(quoteLines).values(
      priced.map((p, index) => ({
        quoteId: quote.id,
        position: index,
        labelFr: p.item.labelFr,
        labelEn: p.item.labelEn,
        unit: p.item.unit,
        quantity: p.quantity,
        unitPriceCents: p.unitPriceCents,
        vatRateBp: p.vatRateBp,
        totalCents: totals.lines[index]?.totalCents ?? 0,
        vatCents: totals.lines[index]?.vatCents ?? 0,
      })),
    );

    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: "quote",
        oldValue: null,
        newValue: { version: quote.version, totalCents: quote.totalCents },
        actorId: actor.id,
      },
      signal,
    );
    return quote;
  });
  return ok(toQuote(row));
}

export async function listQuotes(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Result<QuoteRow[], AppError>> {
  const visible = await visibleDeal(db, actor, dealId);
  if (!visible)
    return err(new AppError(ERROR_IDS.DEAL_NOT_FOUND, "Deal not found or not visible", { dealId }));
  signal.throwIfAborted();
  const rows = await db
    .select()
    .from(quotes)
    .where(eq(quotes.dealId, dealId))
    .orderBy(desc(quotes.version));
  return ok(rows.map(toQuote));
}

export async function markQuoteSent(
  db: DbOrTx,
  actor: PermSetUser,
  quoteId: string,
  signal: AbortSignal,
): Promise<Result<QuoteRow, AppError>> {
  return transition(db, actor, quoteId, "draft", "sent", signal);
}

export async function acceptQuote(
  db: DbOrTx,
  actor: PermSetUser,
  quoteId: string,
  signal: AbortSignal,
): Promise<Result<QuoteRow, AppError>> {
  return transition(db, actor, quoteId, "sent", "accepted", signal);
}

async function transition(
  db: DbOrTx,
  actor: PermSetUser,
  quoteId: string,
  from: QuoteStatus,
  to: QuoteStatus,
  signal: AbortSignal,
): Promise<Result<QuoteRow, AppError>> {
  const [current] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (current === undefined) return err(new AppError(ERROR_IDS.QUOTE_NOT_FOUND, "Quote not found"));
  const editable = await loadEditableDeal(db, actor, current.dealId, signal);
  if (!editable.ok) return err(editable.error);
  if (current.status !== from) return err(invalid(`A ${current.status} quote cannot become ${to}`));

  const [updated] = await db.transaction(async (tx) => {
    const rows = await tx
      .update(quotes)
      .set({ status: to })
      .where(and(eq(quotes.id, quoteId), eq(quotes.status, from)))
      .returning();
    if (rows.length === 0)
      throw new AppError(ERROR_IDS.QUOTE_INVALID, "Quote changed while being updated");
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: current.dealId,
        field: "quote_status",
        oldValue: { version: current.version, status: from },
        newValue: { version: current.version, status: to },
        actorId: actor.id,
      },
      signal,
    );
    return rows;
  });
  return ok(toQuote(updated ?? current));
}

async function visibleDeal(db: DbOrTx, actor: PermSetUser, dealId: string): Promise<boolean> {
  const [deal] = await db
    .select({
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
  return deal !== undefined && canSee(actor, toVisibleDeal(deal, deal.pipelineVisibilityGroupId));
}

function toPriceItem(r: typeof priceItems.$inferSelect): PriceItemRow {
  return {
    id: r.id,
    labelFr: r.labelFr,
    labelEn: r.labelEn,
    unit: r.unit,
    unitPriceCents: r.unitPriceCents,
    vatRateBp: r.vatRateBp,
    active: r.active,
  };
}

function toQuote(r: typeof quotes.$inferSelect): QuoteRow {
  return {
    id: r.id,
    dealId: r.dealId,
    version: r.version,
    status: r.status,
    language: r.language,
    validUntil: r.validUntil,
    subtotalCents: r.subtotalCents,
    vatCents: r.vatCents,
    totalCents: r.totalCents,
    createdAt: r.createdAt,
  };
}
