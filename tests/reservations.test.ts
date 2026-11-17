import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { journal, reservations } from "@/db/schema";
import type { CurrentUser } from "@/lib/current-user";
import { BookingConflictError, ValidationError } from "@/lib/errors";
import { ForbiddenError } from "@/lib/permissions";
import { createDossier } from "@/lib/services/dossiers";
import { cancelReservation, createReservation, listReservations } from "@/lib/services/reservations";
import { isoDay, resetDatabase, seedOrg } from "./helpers";

// Point critique n°1 du brief : la double réservation doit être impossible.

describe("réservations : impossibilité de double réservation (base réelle)", () => {
  let manager: CurrentUser;
  let partner: CurrentUser;
  let otherOrgAdmin: CurrentUser;
  let dossierA: string;
  let dossierB: string;
  let dossierOther: string;

  const ferme = (dossierId: string, start: number, end: number) => ({
    dossierId,
    startDate: isoDay(start),
    endDate: isoDay(end),
    kind: "ferme",
  });

  beforeAll(async () => {
    await resetDatabase();
    const a = await seedOrg("org-a");
    const b = await seedOrg("org-b");
    manager = await a.make("gestion@example.com", "manager");
    partner = await a.make("partenaire@example.com", "partner");
    otherOrgAdmin = await b.make("admin-b@example.com", "admin");
    dossierA = (await createDossier(manager, { clientName: "Client fictif A", type: "mariage" })).id;
    dossierB = (await createDossier(manager, { clientName: "Client fictif B", type: "sejour" })).id;
    dossierOther = (await createDossier(otherOrgAdmin, { clientName: "Client fictif C", type: "autre" })).id;
  });

  it("refuse des dates qui chevauchent une réservation ferme, sans rien écrire", async () => {
    const first = await createReservation(manager, ferme(dossierA, 100, 103));
    const before = (await db.select().from(journal)).length;

    for (const [start, end] of [[100, 103], [99, 100], [103, 110], [101, 102], [90, 120]]) {
      await expect(createReservation(manager, ferme(dossierB, start, end))).rejects.toBeInstanceOf(
        BookingConflictError,
      );
    }

    const active = await db.select().from(reservations).where(eq(reservations.state, "active"));
    expect(active.map((r) => r.id)).toEqual([first.id]);
    expect((await db.select().from(journal)).length).toBe(before);
  });

  it("accepte des dates adjacentes (la veille et le lendemain)", async () => {
    await expect(createReservation(manager, ferme(dossierB, 97, 99))).resolves.toBeDefined();
    await expect(createReservation(manager, ferme(dossierB, 104, 105))).resolves.toBeDefined();
  });

  it("une option non expirée bloque aussi les dates", async () => {
    await createReservation(manager, {
      dossierId: dossierA,
      startDate: isoDay(200),
      endDate: isoDay(202),
      kind: "option",
      optionExpiresOn: isoDay(10),
    });
    await expect(createReservation(manager, ferme(dossierB, 201, 201))).rejects.toBeInstanceOf(
      BookingConflictError,
    );
  });

  it("une option expirée libère ses dates, et son expiration est journalisée", async () => {
    const option = await createReservation(manager, {
      dossierId: dossierA,
      startDate: isoDay(300),
      endDate: isoDay(302),
      kind: "option",
      optionExpiresOn: isoDay(5),
    });
    // On simule le passage du temps : l'option a expiré hier.
    await db
      .update(reservations)
      .set({ optionExpiresAt: new Date(Date.now() - 24 * 3600 * 1000) })
      .where(eq(reservations.id, option.id));

    await expect(createReservation(manager, ferme(dossierB, 300, 302))).resolves.toBeDefined();

    const [expired] = await db.select().from(reservations).where(eq(reservations.id, option.id));
    expect(expired.state).toBe("expired");
    const entries = await db.select().from(journal).where(eq(journal.objectId, option.id));
    expect(entries.map((e) => e.action)).toContain("reservation.option_expired");
    expect(entries.find((e) => e.action === "reservation.option_expired")?.actorName).toBe("Système");
  });

  it("une réservation annulée libère ses dates", async () => {
    const r = await createReservation(manager, ferme(dossierA, 400, 402));
    await expect(createReservation(manager, ferme(dossierB, 401, 401))).rejects.toBeInstanceOf(
      BookingConflictError,
    );
    await cancelReservation(manager, r.id);
    await expect(createReservation(manager, ferme(dossierB, 401, 401))).resolves.toBeDefined();
  });

  it("deux demandes simultanées sur les mêmes dates : une seule passe", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, (_, i) =>
        createReservation(manager, ferme(i % 2 ? dossierA : dossierB, 500, 503)),
      ),
    );
    const ok = results.filter((r) => r.status === "fulfilled");
    const refused = results.filter((r) => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(refused).toHaveLength(5);
    for (const r of refused) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(BookingConflictError);
    }
  });

  it("la base refuse le chevauchement même si on contourne l'application", async () => {
    await createReservation(manager, ferme(dossierA, 600, 602));
    let error: unknown;
    try {
      await db.insert(reservations).values({
        organisationId: manager.organisationId,
        dossierId: dossierB,
        startDate: isoDay(601),
        endDate: isoDay(605),
        kind: "ferme",
      });
    } catch (e) {
      error = e;
    }
    expect((error as { cause?: { code?: string } })?.cause?.code).toBe("23P01");
  });

  it("deux organisations peuvent réserver les mêmes dates chacune chez elle", async () => {
    await expect(
      createReservation(otherOrgAdmin, ferme(dossierOther, 100, 103)),
    ).resolves.toBeDefined();
  });

  it("refuse les saisies incohérentes", async () => {
    await expect(createReservation(manager, ferme(dossierA, 710, 705))).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createReservation(manager, { ...ferme(dossierA, 720, 721), kind: "option" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createReservation(manager, { ...ferme(dossierA, 720, 721), kind: "option", optionExpiresOn: isoDay(-2) }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createReservation(manager, { ...ferme(dossierA, 720, 721), startDate: "2030-02-31" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("le partenaire voit le planning mais ne réserve ni n'annule", async () => {
    const visible = await listReservations(partner, { from: isoDay(90), to: isoDay(110) });
    expect(visible.length).toBeGreaterThan(0);
    await expect(createReservation(partner, ferme(dossierA, 800, 801))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(cancelReservation(partner, visible[0].id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("le planning ne montre que les réservations actives de la période", async () => {
    const rows = await listReservations(manager, { from: isoDay(300), to: isoDay(302) });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "ferme", clientName: "Client fictif B" });
  });
});
