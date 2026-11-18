import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// One line of the estate's bank statement, as imported from the bank (a statement export today,
// the bank's API later). Money is integer cents; a positive amount is money coming in.
// A payment line of a deal points at the transaction that settles it (payment_lines), which is
// what "matched with the bank" means.
export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookedOn: date("booked_on", { mode: "string" }).notNull(),
    label: text("label").notNull(),
    amountCents: integer("amount_cents").notNull(),
    account: text("account"),
    // The line's identity in its source, so importing the same statement twice adds nothing.
    externalKey: text("external_key").notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("bank_transactions_external_key").on(t.externalKey),
    index("bank_transactions_amount_idx").on(t.amountCents),
  ],
);
