import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { calendarFeeds } from "@/db/schema/calendarFeeds";
import { withTestDb } from "@/db/testing";
import { syncEnabledCalendarFeeds } from "./syncEnabledFeeds";

// The external calendars are faked: the tests never reach the network.
const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);
const EMPTY_CALENDAR = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n";

describe("scheduled calendar sync (base réelle, calendriers simulés)", () => {
  it("syncs every enabled calendar, skips the disabled one, and keeps going when one fails", async () => {
    await withTestDb(async (db) => {
      const [ok] = await db
        .insert(calendarFeeds)
        .values({ label: "Airbnb A", url: "https://a.airbnb.com/ical/a.ics", enabled: true })
        .returning();
      const [broken] = await db
        .insert(calendarFeeds)
        .values({ label: "Airbnb B", url: "https://b.airbnb.com/ical/b.ics", enabled: true })
        .returning();
      const [off] = await db
        .insert(calendarFeeds)
        .values({ label: "Désactivé", url: "https://c.airbnb.com/ical/c.ics", enabled: false })
        .returning();
      if (ok === undefined || broken === undefined || off === undefined)
        throw new Error("insert failed");

      const fetched: string[] = [];
      const fetchFeed = (url: string) => {
        fetched.push(url);
        return Promise.resolve(
          url.includes("/b.")
            ? { ok: false as const }
            : { ok: true as const, text: EMPTY_CALENDAR },
        );
      };
      const run = await syncEnabledCalendarFeeds(db, fetchFeed, SIGNAL());

      expect(run).toEqual({ synced: 1, failed: 1 });
      expect(fetched).not.toContain("https://c.airbnb.com/ical/c.ics");
      const [a] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, ok.id));
      const [b] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, broken.id));
      const [c] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, off.id));
      expect(a?.lastSyncedAt).not.toBeNull();
      expect(a?.lastError).toBeNull();
      expect(b?.lastError).not.toBeNull();
      expect(c?.lastSyncedAt).toBeNull();
    });
  });
});
