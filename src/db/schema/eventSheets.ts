import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { deals } from "./deals";

// The headcount and the notes of a booking's event. One row per deal, created on first save.
export const eventSheets = pgTable("event_sheets", {
  dealId: uuid("deal_id")
    .primaryKey()
    .references(() => deals.id, { onDelete: "cascade" }),
  headcount: integer("headcount"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// The caterers, the DJ, the decorators and the like, with the time each one arrives.
export const eventProviders = pgTable("event_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  contact: text("contact"),
  arrivalTime: text("arrival_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The places guests sleep: the house, the pool house, a room. Beds are a count, not a list.
export const eventAccommodations = pgTable("event_accommodations", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  beds: integer("beds"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
