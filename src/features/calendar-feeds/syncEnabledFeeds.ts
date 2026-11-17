// Syncs every enabled calendar in turn. A calendar that fails is recorded on its own row and does
// not stop the others, so one broken Airbnb link never blocks the rest of the bookings.
import { eq } from "drizzle-orm";
import { calendarFeeds } from "@/db/schema/calendarFeeds";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { type FeedFetch, runFeedSync } from "./feedSync";

export interface EnabledSyncResult {
  synced: number;
  failed: number;
}

export async function syncEnabledCalendarFeeds(
  db: DbOrTx,
  fetchFeed: FeedFetch,
  signal: AbortSignal,
): Promise<EnabledSyncResult> {
  const enabled = await db
    .select({ id: calendarFeeds.id })
    .from(calendarFeeds)
    .where(eq(calendarFeeds.enabled, true));
  const result: EnabledSyncResult = { synced: 0, failed: 0 };
  for (const feed of enabled) {
    signal.throwIfAborted();
    const outcome = await runFeedSync(db, feed.id, fetchFeed, signal);
    if (outcome.ok) result.synced += 1;
    else result.failed += 1;
  }
  return result;
}
