import { sql } from "drizzle-orm";
import { check, date, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { PAYMENT_KINDS, PAYMENT_STATUSES } from "@/features/payments/paymentRules";
import { deals } from "./deals";

export const paymentKindEnum = pgEnum("payment_line_kind", PAYMENT_KINDS);
export const paymentStatusEnum = pgEnum("payment_line_status", PAYMENT_STATUSES);

// One row per amount expected on a booking. Money is integer cents, as in the quotes.
// A settled line always records the day it was settled, so the schedule can be trusted.
export const paymentLines = pgTable(
  "payment_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    kind: paymentKindEnum("kind").notNull(),
    status: paymentStatusEnum("status").notNull(),
    amountCents: integer("amount_cents").notNull(),
    dueOn: date("due_on", { mode: "string" }).notNull(),
    paidOn: date("paid_on", { mode: "string" }),
    reference: text("reference"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("payment_lines_amount_positive", sql`${t.amountCents} > 0`),
    check(
      "payment_lines_settled_has_day",
      sql`${t.status} NOT IN ('paid', 'released') OR ${t.paidOn} IS NOT NULL`,
    ),
  ],
);
