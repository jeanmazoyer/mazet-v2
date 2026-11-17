import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { calendarFeeds } from "@/db/schema/calendarFeeds";
import { deals } from "@/db/schema/deals";
import { reservations } from "@/db/schema/reservations";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import {
  cancelReservation,
  createReservation,
  listReservations,
} from "@/features/reservations/reservationRepo";
import type { HydratedActor } from "@/server/hydrateActor";
import { addCalendarFeed, type FeedFetch, syncCalendarFeed } from "./feedSync";

// The external calendar is faked: the tests never reach the network.
const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);
type Db = Parameters<Parameters<typeof withTestDb>[0]>[0];

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

// iCal writes days without dashes (20300612); the tests speak ISO days and convert.
const compact = (iso: string): string => iso.replace(/-/g, "");
const ics = (events: Array<{ uid: string; start: string; end: string }>): string =>
  [
    "BEGIN:VCALENDAR",
    ...events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTART;VALUE=DATE:${compact(e.start)}`,
      `DTEND;VALUE=DATE:${compact(e.end)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n");

const fakeFetch =
  (text: string): FeedFetch =>
  () =>
    Promise.resolve({ ok: true, text });

async function setup(db: Db) {
  const owner = await seedUser(db, { name: "Owner", email: "owner@example.com" });
  const admin = await seedUser(db, { name: "Admin", email: "admin@example.com", isAdmin: true });
  const { pipeline, stages } = await seedPipelineWithStages(db, ["Demande"]);
  const [deal] = await db
    .insert(deals)
    .values({
      title: "Séjour manuel",
      pipelineId: pipeline.id,
      stageId: stages[0]?.id ?? "",
      ownerId: owner.id,
      visibilityLevel: "all",
    })
    .returning();
  if (deal === undefined) throw new Error("deal insert returned no row");
  const adminActor = actorOf(admin, "admin");
  const feed = await addCalendarFeed(
    db,
    adminActor,
    { label: "Airbnb - Maison", url: "https://www.airbnb.com/calendar/ical/1.ics" },
    SIGNAL(),
  );
  if (!feed.ok) throw new Error(`feed refused: ${feed.error.id}`);
  return {
    admin: adminActor,
    regular: actorOf(owner, "regular", ["deal.edit_own"]),
    dealId: deal.id,
    feedId: feed.value.id,
  };
}

describe("calendar feeds: copying external bookings (base réelle)", () => {
  it("only an administrator adds a feed, and only for an Airbnb address", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const byRegular = await addCalendarFeed(
        db,
        s.regular,
        { label: "x", url: "https://www.airbnb.com/calendar/ical/2.ics" },
        SIGNAL(),
      );
      expect(!byRegular.ok && byRegular.error.id).toBe(ERROR_IDS.PERM_DENIED);
      const elsewhere = await addCalendarFeed(
        db,
        s.admin,
        { label: "x", url: "https://example.com/c.ics" },
        SIGNAL(),
      );
      expect(!elsewhere.ok && elsewhere.error.id).toBe(ERROR_IDS.FEED_INVALID);
    });
  });

  it("copies the blocked days as bookings with no deal, visible in the calendar", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const r = await syncCalendarFeed(
        db,
        s.admin,
        s.feedId,
        fakeFetch(ics([{ uid: "a@airbnb", start: "2030-06-12", end: "2030-06-15" }])),
        SIGNAL(),
      );
      expect(r.ok && r.value).toEqual({ created: 1, cancelled: 0, conflicts: [] });
      const shown = await listReservations(
        db,
        s.regular,
        { from: "2030-06-01", to: "2030-06-30" },
        SIGNAL(),
      );
      expect(shown).toHaveLength(1);
      expect(shown[0]).toMatchObject({
        dealId: null,
        dealTitle: "Airbnb - Maison",
        startDate: "2030-06-12",
        endDate: "2030-06-14",
        kind: "firm",
      });
      const [feed] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, s.feedId));
      expect(feed?.lastSyncedAt).not.toBeNull();
      expect(feed?.lastError).toBeNull();
    });
  });

  it("syncing the same calendar again creates nothing twice", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const text = ics([{ uid: "a@airbnb", start: "2030-06-12", end: "2030-06-15" }]);
      await syncCalendarFeed(db, s.admin, s.feedId, fakeFetch(text), SIGNAL());
      const again = await syncCalendarFeed(db, s.admin, s.feedId, fakeFetch(text), SIGNAL());
      expect(again.ok && again.value.created).toBe(0);
      expect(await db.select().from(reservations)).toHaveLength(1);
    });
  });

  it("an event that disappears from the calendar is cancelled here", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await syncCalendarFeed(
        db,
        s.admin,
        s.feedId,
        fakeFetch(ics([{ uid: "a@airbnb", start: "2030-06-12", end: "2030-06-15" }])),
        SIGNAL(),
      );
      const r = await syncCalendarFeed(db, s.admin, s.feedId, fakeFetch(ics([])), SIGNAL());
      expect(r.ok && r.value.cancelled).toBe(1);
      expect(
        await listReservations(db, s.regular, { from: "2030-06-01", to: "2030-06-30" }, SIGNAL()),
      ).toEqual([]);
    });
  });

  it("a manual booking on the same days is kept, and the clash is reported, not hidden", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const manual = await createReservation(
        db,
        s.regular,
        {
          dealId: s.dealId,
          startDate: "2030-06-13",
          endDate: "2030-06-13",
          kind: "firm",
          optionExpiresOn: null,
        },
        SIGNAL(),
      );
      expect(manual.ok).toBe(true);
      const r = await syncCalendarFeed(
        db,
        s.admin,
        s.feedId,
        fakeFetch(ics([{ uid: "a@airbnb", start: "2030-06-12", end: "2030-06-15" }])),
        SIGNAL(),
      );
      expect(r.ok && r.value.conflicts).toEqual(["a@airbnb"]);
      const shown = await listReservations(
        db,
        s.regular,
        { from: "2030-06-01", to: "2030-06-30" },
        SIGNAL(),
      );
      expect(shown.map((x) => x.dealId)).toEqual([s.dealId]);
      const [feed] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, s.feedId));
      expect(feed?.lastError).toMatch(/1 booking clash/);
    });
  });

  it("a failed download keeps the bookings already copied and records the error", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await syncCalendarFeed(
        db,
        s.admin,
        s.feedId,
        fakeFetch(ics([{ uid: "a@airbnb", start: "2030-06-12", end: "2030-06-15" }])),
        SIGNAL(),
      );
      const down: FeedFetch = () => Promise.resolve({ ok: false });
      const r = await syncCalendarFeed(db, s.admin, s.feedId, down, SIGNAL());
      expect(!r.ok && r.error.id).toBe(ERROR_IDS.FEED_FETCH_FAILED);
      expect(
        await listReservations(db, s.regular, { from: "2030-06-01", to: "2030-06-30" }, SIGNAL()),
      ).toHaveLength(1);
      const [feed] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, s.feedId));
      expect(feed?.lastError).toBeTruthy();
    });
  });

  it("a file that is not a calendar is refused and changes nothing", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const r = await syncCalendarFeed(
        db,
        s.admin,
        s.feedId,
        fakeFetch("<html>login</html>"),
        SIGNAL(),
      );
      expect(!r.ok && r.error.id).toBe(ERROR_IDS.FEED_INVALID);
      expect(await db.select().from(reservations)).toHaveLength(0);
    });
  });

  it("a copied booking cannot be cancelled by hand: it follows its calendar", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await syncCalendarFeed(
        db,
        s.admin,
        s.feedId,
        fakeFetch(ics([{ uid: "a@airbnb", start: "2030-06-12", end: "2030-06-15" }])),
        SIGNAL(),
      );
      const [row] = await db.select().from(reservations);
      const r = await cancelReservation(db, s.regular, row?.id ?? "", SIGNAL());
      expect(!r.ok && r.error.id).toBe(ERROR_IDS.PERM_DENIED);
    });
  });
});
