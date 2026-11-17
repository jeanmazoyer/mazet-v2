import { and, asc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, dossiers, reservations } from "@/db/schema";
import type { CurrentUser } from "@/lib/current-user";
import { RESERVATION_KINDS, isOneOf, type ReservationKind } from "@/lib/dossiers";
import { BookingConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { SYSTEM_ACTOR, recordEvent } from "@/lib/journal";
import { assertCan } from "@/lib/permissions";
import { isIsoDate } from "@/lib/validation";

export type ReservationInput = {
  dossierId: unknown;
  startDate: unknown;
  endDate: unknown;
  kind: unknown;
  optionExpiresOn?: unknown; // date (jour inclus) jusqu'à laquelle l'option tient
};

export type ReservationListItem = {
  id: string;
  dossierId: string;
  dossierNumber: number;
  clientName: string;
  startDate: string;
  endDate: string;
  kind: ReservationKind;
  optionExpiresAt: Date | null;
};

// Code Postgres d'une violation de contrainte d'exclusion.
const EXCLUSION_VIOLATION = "23P01";

function isExclusionViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === EXCLUSION_VIOLATION || e?.cause?.code === EXCLUSION_VIOLATION;
}

// Les options dont la date d'expiration est passée libèrent leurs dates.
// Appelé avant toute création et à l'affichage du planning.
export async function expireStaleOptions(organisationId: string): Promise<number> {
  return db.transaction(async (tx) => {
    const expired = await tx
      .update(reservations)
      .set({ state: "expired" })
      .where(
        and(
          eq(reservations.organisationId, organisationId),
          eq(reservations.kind, "option"),
          eq(reservations.state, "active"),
          lt(reservations.optionExpiresAt, sql`now()`),
        ),
      )
      .returning({ id: reservations.id, dossierId: reservations.dossierId });

    for (const r of expired) {
      await recordEvent(tx, {
        organisationId,
        actor: SYSTEM_ACTOR,
        action: "reservation.option_expired",
        objectType: "reservation",
        objectId: r.id,
        detail: { dossierId: r.dossierId },
      });
    }
    return expired.length;
  });
}

export async function createReservation(actor: CurrentUser, input: ReservationInput) {
  assertCan(actor.role, "calendar.write");

  if (typeof input.dossierId !== "string" || !input.dossierId) {
    throw new ValidationError("dossier_required");
  }
  if (!isIsoDate(input.startDate) || !isIsoDate(input.endDate)) {
    throw new ValidationError("invalid_date");
  }
  if (input.endDate < input.startDate) throw new ValidationError("dates_order");
  if (!isOneOf(RESERVATION_KINDS, input.kind)) throw new ValidationError("invalid_kind");

  let optionExpiresAt: Date | null = null;
  if (input.kind === "option") {
    if (!isIsoDate(input.optionExpiresOn)) throw new ValidationError("expiry_required");
    // L'option tient jusqu'à la fin du jour indiqué.
    optionExpiresAt = new Date(`${input.optionExpiresOn}T23:59:59.999Z`);
    if (optionExpiresAt.getTime() <= Date.now()) throw new ValidationError("expiry_past");
  }

  const dossierId = input.dossierId;
  const startDate = input.startDate;
  const endDate = input.endDate;
  const kind = input.kind;

  await expireStaleOptions(actor.organisationId);

  try {
    return await db.transaction(async (tx) => {
      const [dossier] = await tx
        .select({ id: dossiers.id })
        .from(dossiers)
        .where(and(eq(dossiers.id, dossierId), eq(dossiers.organisationId, actor.organisationId)))
        .limit(1);
      if (!dossier) throw new NotFoundError("dossier");

      const [created] = await tx
        .insert(reservations)
        .values({
          organisationId: actor.organisationId,
          dossierId,
          startDate,
          endDate,
          kind,
          optionExpiresAt,
        })
        .returning();

      await recordEvent(tx, {
        organisationId: actor.organisationId,
        actor: { id: actor.id, name: actor.name },
        action: "reservation.created",
        objectType: "reservation",
        objectId: created.id,
        detail: { dossierId, startDate, endDate, kind },
      });

      return created;
    });
  } catch (error) {
    // La base a refusé : les dates chevauchent une réservation active.
    if (isExclusionViolation(error)) throw new BookingConflictError();
    throw error;
  }
}

export async function cancelReservation(actor: CurrentUser, reservationId: string) {
  assertCan(actor.role, "calendar.write");

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(reservations)
      .where(
        and(eq(reservations.id, reservationId), eq(reservations.organisationId, actor.organisationId)),
      )
      .limit(1)
      .for("update");
    if (!current) throw new NotFoundError("réservation");
    if (current.state !== "active") return current;

    const [updated] = await tx
      .update(reservations)
      .set({ state: "cancelled" })
      .where(eq(reservations.id, reservationId))
      .returning();

    await recordEvent(tx, {
      organisationId: actor.organisationId,
      actor: { id: actor.id, name: actor.name },
      action: "reservation.cancelled",
      objectType: "reservation",
      objectId: reservationId,
      detail: { dossierId: current.dossierId },
    });

    return updated;
  });
}

// Réservations actives qui touchent la période [from, to] (dates incluses).
export async function listReservations(
  actor: CurrentUser,
  range: { from: string; to: string },
): Promise<ReservationListItem[]> {
  assertCan(actor.role, "calendar.read");
  await expireStaleOptions(actor.organisationId);

  return db
    .select({
      id: reservations.id,
      dossierId: reservations.dossierId,
      dossierNumber: dossiers.number,
      clientName: clients.name,
      startDate: reservations.startDate,
      endDate: reservations.endDate,
      kind: reservations.kind,
      optionExpiresAt: reservations.optionExpiresAt,
    })
    .from(reservations)
    .innerJoin(dossiers, eq(dossiers.id, reservations.dossierId))
    .innerJoin(clients, eq(clients.id, dossiers.clientId))
    .where(
      and(
        eq(reservations.organisationId, actor.organisationId),
        eq(reservations.state, "active"),
        lte(reservations.startDate, range.to),
        gte(reservations.endDate, range.from),
      ),
    )
    .orderBy(asc(reservations.startDate));
}

export async function listDossierReservations(actor: CurrentUser, dossierId: string) {
  assertCan(actor.role, "calendar.read");
  await expireStaleOptions(actor.organisationId);
  return db
    .select()
    .from(reservations)
    .where(
      and(eq(reservations.dossierId, dossierId), eq(reservations.organisationId, actor.organisationId)),
    )
    .orderBy(asc(reservations.startDate));
}
