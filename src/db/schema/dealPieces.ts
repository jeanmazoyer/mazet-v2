import { date, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { PIECE_KINDS, PIECE_STATUSES } from "@/features/deal-pieces/pieceRules";
import { deals } from "./deals";

export const pieceKindEnum = pgEnum("deal_piece_kind", PIECE_KINDS);
export const pieceStatusEnum = pgEnum("deal_piece_status", PIECE_STATUSES);

// One row per document a booking must hold. The checklist is created with the deal and kept
// complete by ensureDealPieces; the unique (deal, kind) index keeps it to one row per document.
export const dealPieces = pgTable(
  "deal_pieces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    kind: pieceKindEnum("kind").notNull(),
    status: pieceStatusEnum("status").notNull().default("missing"),
    reference: text("reference"),
    expiresOn: date("expires_on", { mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("deal_pieces_deal_kind_key").on(t.dealId, t.kind)],
);
