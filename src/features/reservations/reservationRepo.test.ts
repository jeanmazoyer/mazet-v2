import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { changeLogs } from "@/db/schema/changeLogs";
import { deals } from "@/db/schema/deals";
import { pipelines } from "@/db/schema/pipelines";
import { reservations } from "@/db/schema/reservations";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import type { HydratedActor } from "@/server/hydrateActor";
import {
  cancelReservation,
  createReservation,
  listBookableDeals,
  listReservations,
} from "./reservationRepo";

// Point critique du brief : deux dossiers ne peuvent jamais bloquer le même jour.
// Données entièrement fictives.

const DAY = 86_400_000;
const at = (days: number): string => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);

function actorOf(
  user: { id: string; name: string; email: string },
  kind: "admin" | "regular",
  flags: PermissionFlagKey[] = [],
): HydratedActor {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: null,
    type: kind,
    isActive: true,
    groupIds: new Set(),
    flags: new Set(flags),
  };
}

async function setup(db: Parameters<Parameters<typeof withTestDb>[0]>[0]) {
  const owner = await seedUser(db, { name: "Owner", email: "owner@example.com" });
  const admin = await seedUser(db, { name: "Admin", email: "admin@example.com", isAdmin: true });
  const { pipeline, stages } = await seedPipelineWithStages(db, ["Demande"]);
  const stageId = stages[0]?.id ?? "";

  const insertDeal = async (title: string, ownerId: string, visibilityLevel: "all" | "owner") => {
    const [row] = await db
      .insert(deals)
      .values({ title, pipelineId: pipeline.id, stageId, ownerId, visibilityLevel })
      .returning();
    if (row === undefined) throw new Error("deal insert returned no row");
    return row.id;
  };

  return {
    pipelineId: pipeline.id,
    owner: actorOf(owner, "regular", ["deal.edit_own"]),
    stranger: actorOf(
      { id: "00000000-0000-4000-8000-000000000001", name: "Stranger", email: "s@example.com" },
      "regular",
    ),
    admin: actorOf(admin, "admin"),
    ownerId: owner.id,
    insertDeal,
  };
}

describe("reservations: bookings of the estate's dates (base réelle)", () => {
  it("books the dates and records the change in the audit trail", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", s.ownerId, "all");

      const r = await createReservation(
        db,
        s.owner,
        { dealId, startDate: at(100), endDate: at(102), kind: "firm", optionExpiresOn: null },
        SIGNAL(),
      );
      expect(r.ok).toBe(true);

      const trail = await db.select().from(changeLogs).where(eq(changeLogs.entityId, dealId));
      expect(trail.map((e) => e.field)).toContain("reservation");
    });
  });

  it("refuses a booking that shares a day with an active booking, and allows the neighbouring days", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealA = await s.insertDeal("A", s.ownerId, "all");
      const dealB = await s.insertDeal("B", s.ownerId, "all");
      expect(
        (
          await createReservation(
            db,
            s.owner,
            {
              dealId: dealA,
              startDate: at(100),
              endDate: at(103),
              kind: "firm",
              optionExpiresOn: null,
            },
            SIGNAL(),
          )
        ).ok,
      ).toBe(true);

      for (const [start, end] of [
        [100, 103],
        [99, 100],
        [103, 110],
        [101, 102],
        [90, 120],
      ] as const) {
        const r = await createReservation(
          db,
          s.owner,
          {
            dealId: dealB,
            startDate: at(start),
            endDate: at(end),
            kind: "firm",
            optionExpiresOn: null,
          },
          SIGNAL(),
        );
        expect(r.ok, `${start}..${end} must be refused`).toBe(false);
        if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.RESERVATION_CONFLICT);
      }

      // Adjacent days are free: the booking ends the day before, or starts the day after.
      expect(
        (
          await createReservation(
            db,
            s.owner,
            {
              dealId: dealB,
              startDate: at(97),
              endDate: at(99),
              kind: "firm",
              optionExpiresOn: null,
            },
            SIGNAL(),
          )
        ).ok,
      ).toBe(true);
      expect(
        (
          await createReservation(
            db,
            s.owner,
            {
              dealId: dealB,
              startDate: at(104),
              endDate: at(105),
              kind: "firm",
              optionExpiresOn: null,
            },
            SIGNAL(),
          )
        ).ok,
      ).toBe(true);
    });
  });

  it("an option holds its dates like a firm booking", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealA = await s.insertDeal("A", s.ownerId, "all");
      const dealB = await s.insertDeal("B", s.ownerId, "all");
      expect(
        (
          await createReservation(
            db,
            s.owner,
            {
              dealId: dealA,
              startDate: at(200),
              endDate: at(202),
              kind: "option",
              optionExpiresOn: at(5),
            },
            SIGNAL(),
          )
        ).ok,
      ).toBe(true);
      const r = await createReservation(
        db,
        s.owner,
        {
          dealId: dealB,
          startDate: at(201),
          endDate: at(201),
          kind: "firm",
          optionExpiresOn: null,
        },
        SIGNAL(),
      );
      expect(r.ok).toBe(false);
    });
  });

  it("an option that has expired releases its dates", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealA = await s.insertDeal("A", s.ownerId, "all");
      const dealB = await s.insertDeal("B", s.ownerId, "all");
      const option = await createReservation(
        db,
        s.owner,
        {
          dealId: dealA,
          startDate: at(300),
          endDate: at(302),
          kind: "option",
          optionExpiresOn: at(5),
        },
        SIGNAL(),
      );
      if (!option.ok) throw new Error("option should be created");

      // Time passes: the option lapsed yesterday.
      await db
        .update(reservations)
        .set({ optionExpiresAt: new Date(Date.now() - DAY) })
        .where(eq(reservations.id, option.value.id));

      expect(
        (
          await createReservation(
            db,
            s.owner,
            {
              dealId: dealB,
              startDate: at(300),
              endDate: at(302),
              kind: "firm",
              optionExpiresOn: null,
            },
            SIGNAL(),
          )
        ).ok,
      ).toBe(true);
      const [lapsed] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, option.value.id));
      expect(lapsed?.state).toBe("expired");
    });
  });

  it("a cancelled booking releases its dates", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealA = await s.insertDeal("A", s.ownerId, "all");
      const dealB = await s.insertDeal("B", s.ownerId, "all");
      const first = await createReservation(
        db,
        s.owner,
        {
          dealId: dealA,
          startDate: at(400),
          endDate: at(402),
          kind: "firm",
          optionExpiresOn: null,
        },
        SIGNAL(),
      );
      if (!first.ok) throw new Error("first booking should succeed");

      expect(
        (
          await createReservation(
            db,
            s.owner,
            {
              dealId: dealB,
              startDate: at(401),
              endDate: at(401),
              kind: "firm",
              optionExpiresOn: null,
            },
            SIGNAL(),
          )
        ).ok,
      ).toBe(false);
      expect((await cancelReservation(db, s.owner, first.value.id, SIGNAL())).ok).toBe(true);
      expect(
        (
          await createReservation(
            db,
            s.owner,
            {
              dealId: dealB,
              startDate: at(401),
              endDate: at(401),
              kind: "firm",
              optionExpiresOn: null,
            },
            SIGNAL(),
          )
        ).ok,
      ).toBe(true);
    });
  });

  it("six simultaneous requests for the same dates: exactly one wins", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const deal = await s.insertDeal("Concurrent", s.ownerId, "all");
      const results = await Promise.all(
        Array.from({ length: 6 }, () =>
          createReservation(
            db,
            s.owner,
            {
              dealId: deal,
              startDate: at(500),
              endDate: at(503),
              kind: "firm",
              optionExpiresOn: null,
            },
            SIGNAL(),
          ),
        ),
      );
      expect(results.filter((r) => r.ok)).toHaveLength(1);
      const losers = results.filter((r) => !r.ok);
      expect(losers).toHaveLength(5);
      for (const r of losers) if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.RESERVATION_CONFLICT);
    });
  });

  it("the database refuses an overlapping insert even when the service is bypassed", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealA = await s.insertDeal("A", s.ownerId, "all");
      await createReservation(
        db,
        s.owner,
        {
          dealId: dealA,
          startDate: at(600),
          endDate: at(602),
          kind: "firm",
          optionExpiresOn: null,
        },
        SIGNAL(),
      );

      let error: unknown;
      try {
        await db
          .insert(reservations)
          .values({ dealId: dealA, startDate: at(601), endDate: at(601), kind: "firm" });
      } catch (e) {
        error = e;
      }
      expect((error as { cause?: { code?: string } } | undefined)?.cause?.code).toBe("23P01");
    });
  });

  it("rejects dates that do not exist or end before they start", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const deal = await s.insertDeal("A", s.ownerId, "all");
      const bad = await createReservation(
        db,
        s.owner,
        {
          dealId: deal,
          startDate: "2027-02-31",
          endDate: "2027-03-01",
          kind: "firm",
          optionExpiresOn: null,
        },
        SIGNAL(),
      );
      expect(!bad.ok && bad.error.id).toBe(ERROR_IDS.RESERVATION_INVALID);
      const backwards = await createReservation(
        db,
        s.owner,
        { dealId: deal, startDate: at(10), endDate: at(9), kind: "firm", optionExpiresOn: null },
        SIGNAL(),
      );
      expect(!backwards.ok && backwards.error.id).toBe(ERROR_IDS.RESERVATION_INVALID);
    });
  });

  it("a user who cannot edit the deal cannot book it", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const deal = await s.insertDeal("A", s.ownerId, "all");
      const r = await createReservation(
        db,
        s.stranger,
        { dealId: deal, startDate: at(700), endDate: at(701), kind: "firm", optionExpiresOn: null },
        SIGNAL(),
      );
      expect(!r.ok && r.error.id).toBe(ERROR_IDS.PERM_DENIED);
      expect(await db.select().from(reservations)).toHaveLength(0);
    });
  });

  it("a deal in an archived pipeline cannot be booked", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const deal = await s.insertDeal("A", s.ownerId, "all");
      await db.update(pipelines).set({ isArchived: true }).where(eq(pipelines.id, s.pipelineId));
      const r = await createReservation(
        db,
        s.owner,
        { dealId: deal, startDate: at(800), endDate: at(801), kind: "firm", optionExpiresOn: null },
        SIGNAL(),
      );
      expect(!r.ok && r.error.id).toBe(ERROR_IDS.DEAL_NOT_FOUND);
    });
  });

  it("the list shows only active bookings in the range, and hides deals the viewer cannot see", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const open = await s.insertDeal("Open", s.ownerId, "all");
      const secret = await s.insertDeal("Secret", s.ownerId, "owner");
      await createReservation(
        db,
        s.owner,
        { dealId: open, startDate: at(900), endDate: at(901), kind: "firm", optionExpiresOn: null },
        SIGNAL(),
      );
      await createReservation(
        db,
        s.owner,
        {
          dealId: secret,
          startDate: at(905),
          endDate: at(906),
          kind: "firm",
          optionExpiresOn: null,
        },
        SIGNAL(),
      );
      await createReservation(
        db,
        s.owner,
        { dealId: open, startDate: at(950), endDate: at(951), kind: "firm", optionExpiresOn: null },
        SIGNAL(),
      );

      const range = { from: at(890), to: at(910) };
      const seenByOwner = await listReservations(db, s.owner, range, SIGNAL());
      expect(seenByOwner.map((r) => r.dealTitle).sort()).toEqual(["Open", "Secret"]);

      // "Open" is visible to everyone; "Secret" is owner-only and must not leak.
      const seenByStranger = await listReservations(db, s.stranger, range, SIGNAL());
      expect(seenByStranger.map((r) => r.dealTitle)).toEqual(["Open"]);
    });
  });

  it("lists only the deals the user may book", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await s.insertDeal("Mine", s.ownerId, "all");
      const other = await seedUser(db, { name: "Other", email: "other@example.com" });
      await s.insertDeal("Not mine", other.id, "all");
      const mine = await listBookableDeals(db, s.owner, SIGNAL());
      expect(mine.map((d) => d.title)).toEqual(["Mine"]);
      expect(await listBookableDeals(db, s.stranger, SIGNAL())).toEqual([]);
    });
  });
});
