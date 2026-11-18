import { sql } from "drizzle-orm";
import { boolean, check, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  DOCUMENT_STATUSES,
  TEMPLATE_CATEGORIES,
} from "@/features/document-templates/templateRules";
import { deals } from "./deals";
import { users } from "./identity";

export const documentStatusEnum = pgEnum("deal_document_status", DOCUMENT_STATUSES);

// A Google Doc kept as a template. Its {{field}} placeholders are filled per deal.
export const documentTemplates = pgTable(
  "document_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    driveFileId: text("drive_file_id").notNull().unique(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // The category list is a fixed constant in the code, so it is written as literals here.
    check(
      "document_templates_category_known",
      sql`${t.category} IN (${sql.raw(TEMPLATE_CATEGORIES.map((c) => `'${c}'`).join(", "))})`,
    ),
  ],
);

// A document made for one deal, from a template or from scratch. The file itself lives on Drive.
export const dealDocuments = pgTable("deal_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => documentTemplates.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  status: documentStatusEnum("status").notNull().default("draft"),
  // Set when the document carries an identity number: only administrators see or download it.
  carriesAdminData: boolean("carries_admin_data").notNull().default(false),
  driveFileId: text("drive_file_id").notNull().unique(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
