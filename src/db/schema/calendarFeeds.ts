import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// An external calendar whose booked days are copied into the estate's calendar (Airbnb's iCal
// link, for instance). Only read: warpdrive never writes to the external calendar.
export const calendarFeeds = pgTable("calendar_feeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
