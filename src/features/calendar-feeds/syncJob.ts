// The background job that keeps Airbnb bookings current without anyone pressing "Sync now".
import type { PgBoss } from "pg-boss";
import { PGBOSS_QUEUE_CALENDAR_SYNC } from "@/constants/jobNames";
import { db } from "@/db/client";
import { fetchFeedText } from "./feedFetch";
import { syncEnabledCalendarFeeds } from "./syncEnabledFeeds";

// Every 30 minutes: an Airbnb change reaches the calendar within the half hour.
export const CALENDAR_SYNC_SCHEDULE = "*/30 * * * *";
const CALENDAR_SYNC_TIMEOUT_MS = 5 * 60_000;

export async function registerCalendarSyncJob(boss: PgBoss): Promise<void> {
  await boss.createQueue(PGBOSS_QUEUE_CALENDAR_SYNC);
  await boss.work(PGBOSS_QUEUE_CALENDAR_SYNC, async () => {
    await syncEnabledCalendarFeeds(
      db,
      fetchFeedText,
      AbortSignal.timeout(CALENDAR_SYNC_TIMEOUT_MS),
    );
  });
  await boss.schedule(PGBOSS_QUEUE_CALENDAR_SYNC, CALENDAR_SYNC_SCHEDULE);
}
