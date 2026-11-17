// Bookings of the estate's dates. Every write goes through loadEditableDeal (the same rule as
// editing the deal) and records itself in the audit trail in the same transaction.
// The overlap rule itself lives in the database (EXCLUDE constraint); the check below only turns
// its refusal into a readable error.
import { and, asc, eq, gte, isNull, lt, lte, sql } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { deals } from "@/db/schema/deals";
import { pipelines } from "@/db/schema/pipelines";
import { calendarFeeds } from "@/db/schema/calendarFeeds";
import { reservations } from "@/db/schema/reservations";
import { recordChange } from "@/features/collaboration/changeLog";
import { loadEditableDeal, toVisibleDeal } from "@/features/deals/dealAuth";
import { can } from "@/features/permissions/can";
import { canSee } from "@/features/permissions/canSee";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import {
  type ReservationKind,
  type ReservationRuleError,
  validateReservation,
} from "./reservationRules";

export type ReservationState = "active" | "expired" | "cancelled";

export interface ReservationRow {
  id: string;
  // Null for a booking copied from an external calendar: it belongs to no deal.
  dealId: string | null;
  dealTitle: string;
  startDate: string;
  endDate: string;
  kind: ReservationKind;
  state: ReservationState;
  optionExpiresAt: Date | null;
}

export interface NewReservation {
  dealId: string;
  startDate: string;
  endDate: string;
  kind: ReservationKind;
  optionExpiresOn: string | null;
}

export interface DateRange {
  from: string;
  to: string;
}

const EXCLUSION_VIOLATION = "23P01";
const RULE_MESSAGES: Record<ReservationRuleError, string> = {
  invalid_date: "Enter a real date (YYYY-MM-DD).",
  end_before_start: "The end date cannot be before the start date.",
  option_needs_expiry: "An option needs an expiry date.",
  option_expiry_in_past: "The option expiry date must be in the future.",
};

// Postgres refuses the write with 23P01, either directly or wrapped by the query layer.
function isOverlapRefusal(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === EXCLUSION_VIOLATION || e?.cause?.code === EXCLUSION_VIOLATION;
}

// A deal's visibility fields, joined with its pipeline's group, in the shape canSee/can expect.
const visibleDealColumns = {
  id: deals.id,
  title: deals.title,
  ownerId: deals.ownerId,
  visibilityLevel: deals.visibilityLevel,
  visibilityGroupId: deals.visibilityGroupId,
  visibleToUserIds: deals.visibleToUserIds,
  pipelineVisibilityGroupId: pipelines.visibilityGroupId,
};

// Lapsed options stop holding their dates. Recorded once each, as the system (no actor).
export async function expireStaleOptions(db: DbOrTx, signal: AbortSignal): Promise<void> {
  const lapsed = await db
    .update(reservations)
    .set({ state: "expired" })
    .where(
      and(
        eq(reservations.kind, "option"),
        eq(reservations.state, "active"),
        lt(reservations.optionExpiresAt, sql`now()`),
      ),
    )
    .returning({ id: reservations.id, dealId: reservations.dealId });

  for (const row of lapsed) {
    // Only deal bookings are options, so a lapsed option always has a deal.
    if (row.dealId === null) continue;
    await recordChange(
      db,
      {
        entityType: "deal",
        entityId: row.dealId,
        field: "reservation",
        oldValue: { id: row.id, state: "active" },
        newValue: { id: row.id, state: "expired" },
        actorId: null,
      },
      signal,
    );
  }
}

export async function createReservation(
  db: DbOrTx,
  actor: PermSetUser,
  input: NewReservation,
  signal: AbortSignal,
): Promise<Result<ReservationRow, AppError>> {
  const rule = validateReservation(
    {
      startDate: input.startDate,
      endDate: input.endDate,
      kind: input.kind,
      optionExpiresOn: input.optionExpiresOn,
    },
    new Date(),
  );
  if (!rule.ok) {
    return err(
      new AppError(ERROR_IDS.RESERVATION_INVALID, RULE_MESSAGES[rule.error], {
        reason: rule.error,
      }),
    );
  }

  const editable = await loadEditableDeal(db, actor, input.dealId, signal);
  if (!editable.ok) return err(editable.error);
  const dealTitle = editable.value.deal.title;

  await expireStaleOptions(db, signal);
  signal.throwIfAborted();

  try {
    const row = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(reservations)
        .values({
          dealId: input.dealId,
          startDate: rule.value.startDate,
          endDate: rule.value.endDate,
          kind: rule.value.kind,
          optionExpiresAt: rule.value.optionExpiresAt,
          createdById: actor.id,
        })
        .returning();
      if (created === undefined) {
        throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "reservation insert returned no row");
      }

      await recordChange(
        tx,
        {
          entityType: "deal",
          entityId: input.dealId,
          field: "reservation",
          oldValue: null,
          newValue: {
            id: created.id,
            startDate: created.startDate,
            endDate: created.endDate,
            kind: created.kind,
          },
          actorId: actor.id,
        },
        signal,
      );
      return created;
    });

    return ok({
      id: row.id,
      dealId: row.dealId,
      dealTitle,
      startDate: row.startDate,
      endDate: row.endDate,
      kind: row.kind,
      state: row.state,
      optionExpiresAt: row.optionExpiresAt,
    });
  } catch (error) {
    if (isOverlapRefusal(error)) {
      return err(new AppError(ERROR_IDS.RESERVATION_CONFLICT, "These dates are already booked."));
    }
    throw error;
  }
}

export async function cancelReservation(
  db: DbOrTx,
  actor: PermSetUser,
  reservationId: string,
  signal: AbortSignal,
): Promise<Result<ReservationRow, AppError>> {
  const [found] = await db
    .select({ reservation: reservations, dealTitle: deals.title })
    .from(reservations)
    .leftJoin(deals, eq(deals.id, reservations.dealId))
    .where(eq(reservations.id, reservationId))
    .limit(1);
  if (found === undefined) {
    return err(new AppError(ERROR_IDS.RESERVATION_NOT_FOUND, "Booking not found"));
  }
  const dealId = found.reservation.dealId;
  if (dealId === null) {
    // Copied from a calendar feed: it changes when the external calendar changes, not here.
    return err(new AppError(ERROR_IDS.PERM_DENIED, "This booking follows its external calendar"));
  }
  const current = { reservation: found.reservation, dealTitle: found.dealTitle ?? "" };

  // Cancelling is an edit of the deal, so the same rule applies.
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);

  if (current.reservation.state !== "active") {
    return ok(toRow(current.reservation, current.dealTitle));
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(reservations)
      .set({ state: "cancelled" })
      .where(eq(reservations.id, reservationId))
      .returning();
    if (row === undefined) {
      throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "reservation update returned no row");
    }
    await recordChange(
      tx,
      {
        entityType: "deal",
        entityId: dealId,
        field: "reservation",
        oldValue: { id: row.id, state: "active" },
        newValue: { id: row.id, state: "cancelled" },
        actorId: actor.id,
      },
      signal,
    );
    return row;
  });
  return ok(toRow(updated, current.dealTitle));
}

// Active bookings touching [from, to], restricted to the deals the viewer can see.
export async function listReservations(
  db: DbOrTx,
  actor: PermSetUser,
  range: DateRange,
  signal: AbortSignal,
): Promise<ReservationRow[]> {
  await expireStaleOptions(db, signal);

  const fromFeeds = await listFeedReservations(db, range, signal);
  const rows = await db
    .select({ reservation: reservations, deal: visibleDealColumns })
    .from(reservations)
    .innerJoin(deals, eq(deals.id, reservations.dealId))
    .innerJoin(pipelines, eq(pipelines.id, deals.pipelineId))
    .where(
      and(
        eq(reservations.state, "active"),
        isNull(deals.deletedAt),
        eq(pipelines.isArchived, false),
        lte(reservations.startDate, range.to),
        gte(reservations.endDate, range.from),
      ),
    )
    .orderBy(asc(reservations.startDate));

  const fromDeals = rows
    .filter((r) => canSee(actor, toVisibleDeal(r.deal, r.deal.pipelineVisibilityGroupId)))
    .map((r) => toRow(r.reservation, r.deal.title));
  return [...fromDeals, ...fromFeeds].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// Days blocked by external calendars. Anyone who can read the calendar sees them: they hold
// dates, not client data.
async function listFeedReservations(db: DbOrTx, range: DateRange, signal: AbortSignal): Promise<ReservationRow[]> {
  const rows = await db
    .select({ reservation: reservations, label: calendarFeeds.label })
    .from(reservations)
    .innerJoin(calendarFeeds, eq(calendarFeeds.id, reservations.feedId))
    .where(
      and(
        eq(reservations.state, "active"),
        lte(reservations.startDate, range.to),
        gte(reservations.endDate, range.from),
      ),
    );
  signal.throwIfAborted();
  return rows.map((r) => toRow(r.reservation, r.label));
}

// Deals the user may book: the same rule as editing them, so the picker never offers a deal
// whose booking would then be refused.
export async function listBookableDeals(
  db: DbOrTx,
  actor: PermSetUser,
  signal: AbortSignal,
): Promise<Array<{ id: string; title: string }>> {
  const rows = await db
    .select(visibleDealColumns)
    .from(deals)
    .innerJoin(pipelines, eq(pipelines.id, deals.pipelineId))
    .where(and(isNull(deals.deletedAt), eq(pipelines.isArchived, false)))
    .orderBy(asc(deals.title))
    .limit(500);
  signal.throwIfAborted();

  return rows
    .filter((d) => can(actor, "deal.edit", toVisibleDeal(d, d.pipelineVisibilityGroupId)))
    .map((d) => ({ id: d.id, title: d.title }));
}

function toRow(r: typeof reservations.$inferSelect, dealTitle: string): ReservationRow {
  return {
    id: r.id,
    dealId: r.dealId,
    dealTitle,
    startDate: r.startDate,
    endDate: r.endDate,
    kind: r.kind,
    state: r.state,
    optionExpiresAt: r.optionExpiresAt,
  };
}
