import { customType, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./identity";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

// One Google Drive connection per user. The refresh token is stored encrypted, with the same
// AES-256-GCM packing as the Gmail tokens, never in clear.
export const driveConnections = pgTable("drive_connections", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  accountEmail: text("account_email").notNull(),
  refreshTokenEnc: bytea("refresh_token_enc").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
});
