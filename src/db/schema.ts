import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  CLIENT_LANGUAGES,
  DOSSIER_STATUSES,
  DOSSIER_TYPES,
  RESERVATION_KINDS,
  RESERVATION_STATES,
} from "@/lib/dossiers";
import { ROLES } from "@/lib/permissions";

// Le schéma porte déjà organisation_id : le multi-client est prévu, pas activé.

export const roleEnum = pgEnum("role", ROLES);

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: roleEnum("role").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_key").on(sql`lower(${t.email})`)],
);

// Journal en ajout seul : un trigger SQL (migration personnalisée) interdit
// UPDATE, DELETE et TRUNCATE. Voir src/db/migrations/*journal_immutable*.sql.
export const journal = pgTable(
  "journal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    actorId: uuid("actor_id").references(() => users.id),
    // Nom de l'auteur au moment de l'action : reste lisible même si le compte change.
    actorName: text("actor_name").notNull(),
    action: text("action").notNull(),
    objectType: text("object_type").notNull(),
    objectId: text("object_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("journal_org_at_idx").on(t.organisationId, t.at)],
);

export const clientLanguageEnum = pgEnum("client_language", CLIENT_LANGUAGES);
export const dossierStatusEnum = pgEnum("dossier_status", DOSSIER_STATUSES);
export const dossierTypeEnum = pgEnum("dossier_type", DOSSIER_TYPES);
export const reservationKindEnum = pgEnum("reservation_kind", RESERVATION_KINDS);
export const reservationStateEnum = pgEnum("reservation_state", RESERVATION_STATES);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  language: clientLanguageEnum("language").notNull().default("fr"),
  country: text("country"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dossiers = pgTable(
  "dossiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    // Numéro lisible, propre à chaque organisation (affiché « D-0001 »).
    number: integer("number").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    type: dossierTypeEnum("type").notNull(),
    status: dossierStatusEnum("status").notNull().default("demande"),
    targetDate: date("target_date", { mode: "string" }),
    guests: integer("guests"),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("dossiers_org_number_key").on(t.organisationId, t.number),
    index("dossiers_org_status_idx").on(t.organisationId, t.status),
  ],
);

export const dossierNotes = pgTable(
  "dossier_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id),
    authorId: uuid("author_id").references(() => users.id),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("dossier_notes_dossier_idx").on(t.dossierId, t.createdAt)],
);

// Réservations à la journée, bornes incluses. La double réservation est interdite
// par une contrainte d'exclusion SQL (migration personnalisée *reservations_no_overlap*) :
// deux réservations actives d'une même organisation ne peuvent pas se chevaucher.
export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    kind: reservationKindEnum("kind").notNull(),
    state: reservationStateEnum("state").notNull().default("active"),
    optionExpiresAt: timestamp("option_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reservations_org_dates_idx").on(t.organisationId, t.startDate, t.endDate),
    check("reservations_dates_ordered", sql`${t.endDate} >= ${t.startDate}`),
    check(
      "reservations_option_has_expiry",
      sql`${t.kind} <> 'option' OR ${t.optionExpiresAt} IS NOT NULL`,
    ),
  ],
);
