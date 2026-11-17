import { asc } from "drizzle-orm";
import { calendarFeeds } from "@/db/schema/calendarFeeds";
import type { DbOrTx } from "@/server/realtime/channelVersions";

export interface FeedSummary {
  id: string;
  label: string;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

// Feeds are visible to the team that reads the calendar. The address itself is never shown.
export async function listCalendarFeeds(db: DbOrTx): Promise<FeedSummary[]> {
  const rows = await db
    .select({
      id: calendarFeeds.id,
      label: calendarFeeds.label,
      lastSyncedAt: calendarFeeds.lastSyncedAt,
      lastError: calendarFeeds.lastError,
    })
    .from(calendarFeeds)
    .orderBy(asc(calendarFeeds.label));
  return rows;
}
