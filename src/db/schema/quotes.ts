import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { deals } from "./deals";
import { users } from "./identity";

export const priceUnitEnum = pgEnum("price_unit", ["flat", "per_day", "per_person"]);
export const quoteStatusEnum = pgEnum("quote_status", ["draft", "sent", "accepted"]);
export const quoteLanguageEnum = pgEnum("quote_language", ["fr", "en"]);

// The estate's price grid. Labels exist in both languages because quotes go to FR and EN clients.
export const priceItems = pgTable(
  "price_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labelFr: text("label_fr").notNull(),
    labelEn: text("label_en").notNull(),
    unit: priceUnitEnum("unit").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    vatRateBp: integer("vat_rate_bp").notNull(),
    active: boolean("active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("price_items_price_nonnegative", sql`${t.unitPriceCents} >= 0`),
    check("price_items_vat_known", sql`${t.vatRateBp} IN (0, 210, 550, 1000, 2000)`),
  ],
);

// A quote is a version of a deal's offer. Its totals and line prices are copies, so a later
// change to the grid never rewrites a quote the client has already seen.
export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: quoteStatusEnum("status").notNull().default("draft"),
    language: quoteLanguageEnum("language").notNull(),
    validUntil: date("valid_until", { mode: "string" }),
    notes: text("notes"),
    subtotalCents: integer("subtotal_cents").notNull(),
    vatCents: integer("vat_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    createdById: uuid("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("quotes_deal_version_key").on(t.dealId, t.version),
    index("quotes_deal_idx").on(t.dealId),
  ],
);

export const quoteLines = pgTable(
  "quote_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    labelFr: text("label_fr").notNull(),
    labelEn: text("label_en").notNull(),
    unit: priceUnitEnum("unit").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    vatRateBp: integer("vat_rate_bp").notNull(),
    totalCents: integer("total_cents").notNull(),
    vatCents: integer("vat_cents").notNull(),
  },
  (t) => [index("quote_lines_quote_idx").on(t.quoteId, t.position)],
);
