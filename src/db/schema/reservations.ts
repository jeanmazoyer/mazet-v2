import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { RESERVATION_KINDS } from "@/features/reservations/reservationRules";
import { calendarFeeds } from "./calendarFeeds";
import { deals } from "./deals";
import { users } from "./identity";

export const reservationKindEnum = pgEnum("reservation_kind", RESERVATION_KINDS);
export const reservationStateEnum = pgEnum("reservation_state", ["active", "expired", "cancelled"]);

// Dates of the estate held for a deal. Days are inclusive at both ends.
// The "no two active bookings overlap" rule is an EXCLUDE constraint, written in the custom
// migration 0*_reservations_no_overlap.sql because the schema builder cannot express it. It is
// the last line of defence: the service checks first, but a concurrent or direct insert still
// cannot double-book a day.
export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // A booking belongs to a deal, or was copied from an external calendar feed. Exactly one of
    // the two is set (see the check constraints below).
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    feedId: uuid("feed_id").references(() => calendarFeeds.id, { onDelete: "cascade" }),
    externalUid: text("external_uid"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    kind: reservationKindEnum("kind").notNull(),
    state: reservationStateEnum("state").notNull().default("active"),
    optionExpiresAt: timestamp("option_expires_at", { withTimezone: true }),
    createdById: uuid("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reservations_dates_idx").on(t.startDate, t.endDate),
    index("reservations_deal_idx").on(t.dealId),
    uniqueIndex("reservations_feed_uid_key").on(t.feedId, t.externalUid),
    check("reservations_dates_ordered", sql`${t.endDate} >= ${t.startDate}`),
    check(
      "reservations_one_source",
      sql`(${t.dealId} IS NOT NULL AND ${t.feedId} IS NULL AND ${t.externalUid} IS NULL) OR (${t.dealId} IS NULL AND ${t.feedId} IS NOT NULL AND ${t.externalUid} IS NOT NULL)`,
    ),
    check(
      "reservations_option_has_expiry",
      sql`${t.kind} <> 'option' OR ${t.optionExpiresAt} IS NOT NULL`,
    ),
  ],
);
