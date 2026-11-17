// Copies the days booked on an external calendar into the estate's calendar. The external
// calendar is the source of truth for its own bookings: events that appear are added, moved ones
// follow, and events that vanish are cancelled. A booking that clashes with one made here is never
// overwritten: it is reported, and the clash is shown on the feed.
import { and, eq, inArray } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { calendarFeeds } from "@/db/schema/calendarFeeds";
import { reservations } from "@/db/schema/reservations";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import { isAllowedFeedUrl } from "./feedUrl";
import { type IcsEvent, parseIcs } from "./ics";

export type FeedFetchResult = { ok: true; text: string } | { ok: false };
export type FeedFetch = (url: string, signal: AbortSignal) => Promise<FeedFetchResult>;

export interface SyncSummary {
  created: number;
  cancelled: number;
  conflicts: string[];
}

const EXCLUSION_VIOLATION = "23P01";
const isClash = (error: unknown): boolean => {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === EXCLUSION_VIOLATION || e?.cause?.code === EXCLUSION_VIOLATION;
};

function requireAdmin(actor: PermSetUser): AppError | null {
  return actor.type === "admin"
    ? null
    : new AppError(ERROR_IDS.PERM_DENIED, "Only an administrator manages calendar feeds");
}

export async function addCalendarFeed(
  db: DbOrTx,
  actor: PermSetUser,
  input: { label: string; url: string },
  signal: AbortSignal,
): Promise<Result<{ id: string }, AppError>> {
  const denied = requireAdmin(actor);
  if (denied !== null) return err(denied);
  const label = input.label.trim();
  if (label === "" || label.length > 80)
    return err(new AppError(ERROR_IDS.FEED_INVALID, "Give the calendar a short name"));
  if (!isAllowedFeedUrl(input.url)) {
    return err(
      new AppError(ERROR_IDS.FEED_INVALID, "Only https calendar links from Airbnb can be added"),
    );
  }
  signal.throwIfAborted();
  const [row] = await db
    .insert(calendarFeeds)
    .values({ label, url: input.url })
    .returning({ id: calendarFeeds.id });
  if (row === undefined)
    throw new AppError(ERROR_IDS.DB_INSERT_FAILED, "feed insert returned no row");
  return ok({ id: row.id });
}

export async function syncCalendarFeed(
  db: DbOrTx,
  actor: PermSetUser,
  feedId: string,
  fetchFeed: FeedFetch,
  signal: AbortSignal,
): Promise<Result<SyncSummary, AppError>> {
  const denied = requireAdmin(actor);
  if (denied !== null) return err(denied);
  return runFeedSync(db, feedId, fetchFeed, signal);
}

// The sync itself, without a person behind it: the scheduled job runs it for every enabled calendar.
export async function runFeedSync(
  db: DbOrTx,
  feedId: string,
  fetchFeed: FeedFetch,
  signal: AbortSignal,
): Promise<Result<SyncSummary, AppError>> {
  const [feed] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, feedId)).limit(1);
  if (feed === undefined) return err(new AppError(ERROR_IDS.FEED_NOT_FOUND, "Calendar not found"));

  const download = await fetchFeed(feed.url, signal);
  if (!download.ok) {
    await markFeed(db, feedId, "The calendar could not be downloaded.");
    return err(new AppError(ERROR_IDS.FEED_FETCH_FAILED, "The calendar could not be downloaded"));
  }
  const parsed = parseIcs(download.text);
  if (!parsed.ok) {
    await markFeed(db, feedId, "This file is not a valid calendar.");
    return err(new AppError(ERROR_IDS.FEED_INVALID, "This file is not a valid calendar"));
  }
  signal.throwIfAborted();

  const existing = await db.select().from(reservations).where(eq(reservations.feedId, feedId));
  const byUid = new Map(existing.map((r) => [r.externalUid ?? "", r]));
  const seen = new Set<string>();
  const summary: SyncSummary = { created: 0, cancelled: 0, conflicts: [] };

  for (const event of parsed.value) {
    seen.add(event.uid);
    await applyEvent(db, feedId, event, byUid.get(event.uid), summary);
  }

  // Events that disappeared upstream stop blocking the dates here.
  const gone = existing.filter((r) => r.state === "active" && !seen.has(r.externalUid ?? ""));
  if (gone.length > 0) {
    await db
      .update(reservations)
      .set({ state: "cancelled" })
      .where(
        and(
          eq(reservations.feedId, feedId),
          inArray(
            reservations.id,
            gone.map((r) => r.id),
          ),
        ),
      );
    summary.cancelled = gone.length;
  }

  await markFeed(
    db,
    feedId,
    summary.conflicts.length === 0
      ? null
      : `${summary.conflicts.length} booking clash(es) with a booking made here: ${summary.conflicts.join(", ")}`,
  );
  return ok(summary);
}

// Adds, moves or re-activates one event. A clash with a booking made here is recorded, not forced.
async function applyEvent(
  db: DbOrTx,
  feedId: string,
  event: IcsEvent,
  current: typeof reservations.$inferSelect | undefined,
  summary: SyncSummary,
): Promise<void> {
  if (
    current !== undefined &&
    current.state === "active" &&
    current.startDate === event.startDate &&
    current.endDate === event.endDate
  ) {
    return;
  }
  try {
    if (current === undefined) {
      await db.insert(reservations).values({
        feedId,
        externalUid: event.uid,
        startDate: event.startDate,
        endDate: event.endDate,
        kind: "firm",
        state: "active",
      });
      summary.created += 1;
    } else {
      await db
        .update(reservations)
        .set({ startDate: event.startDate, endDate: event.endDate, state: "active" })
        .where(eq(reservations.id, current.id));
    }
  } catch (error) {
    if (!isClash(error)) throw error;
    summary.conflicts.push(event.uid);
  }
}

async function markFeed(db: DbOrTx, feedId: string, lastError: string | null): Promise<void> {
  await db
    .update(calendarFeeds)
    .set({ lastSyncedAt: new Date(), lastError })
    .where(eq(calendarFeeds.id, feedId));
}
