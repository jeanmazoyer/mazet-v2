import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { CONTRACT_NATURES, PARTY_ROLES } from "@/features/contract-data/contractRules";
import { deals } from "./deals";

export const contractNatureEnum = pgEnum("contract_nature", CONTRACT_NATURES);
export const partyRoleEnum = pgEnum("contract_party_role", PARTY_ROLES);

// The stay terms printed in the contract's particular conditions. One row per deal.
export const contractTerms = pgTable(
  "contract_terms",
  {
    dealId: uuid("deal_id")
      .primaryKey()
      .references(() => deals.id, { onDelete: "cascade" }),
    nature: contractNatureEnum("nature").notNull(),
    occupants: integer("occupants").notNull(),
    arrivalTime: text("arrival_time").notNull(),
    departureTime: text("departure_time").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("contract_terms_occupants_positive", sql`${t.occupants} > 0`)],
);

// The people named in the contract. idNumber is personal data: the repo reveals it to
// administrators only, and the audit trail records that it changed, never its value.
export const contractParties = pgTable(
  "contract_parties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    role: partyRoleEnum("role").notNull(),
    fullName: text("full_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    idNumber: text("id_number"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("contract_parties_deal_role_key").on(t.dealId, t.role)],
);
