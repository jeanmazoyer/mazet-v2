CREATE TYPE "public"."client_language" AS ENUM('fr', 'en');--> statement-breakpoint
CREATE TYPE "public"."dossier_status" AS ENUM('demande', 'visite', 'option', 'devis_envoye', 'signe', 'solde', 'perdu');--> statement-breakpoint
CREATE TYPE "public"."dossier_type" AS ENUM('mariage', 'sejour', 'autre');--> statement-breakpoint
CREATE TYPE "public"."reservation_kind" AS ENUM('option', 'ferme');--> statement-breakpoint
CREATE TYPE "public"."reservation_state" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"language" "client_language" DEFAULT 'fr' NOT NULL,
	"country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dossier_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"dossier_id" uuid NOT NULL,
	"author_id" uuid,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dossiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"client_id" uuid NOT NULL,
	"type" "dossier_type" NOT NULL,
	"status" "dossier_status" DEFAULT 'demande' NOT NULL,
	"target_date" date,
	"guests" integer,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"dossier_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"kind" "reservation_kind" NOT NULL,
	"state" "reservation_state" DEFAULT 'active' NOT NULL,
	"option_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_dates_ordered" CHECK ("reservations"."end_date" >= "reservations"."start_date"),
	CONSTRAINT "reservations_option_has_expiry" CHECK ("reservations"."kind" <> 'option' OR "reservations"."option_expires_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_notes" ADD CONSTRAINT "dossier_notes_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_notes" ADD CONSTRAINT "dossier_notes_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_notes" ADD CONSTRAINT "dossier_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dossier_notes_dossier_idx" ON "dossier_notes" USING btree ("dossier_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "dossiers_org_number_key" ON "dossiers" USING btree ("organisation_id","number");--> statement-breakpoint
CREATE INDEX "dossiers_org_status_idx" ON "dossiers" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX "reservations_org_dates_idx" ON "reservations" USING btree ("organisation_id","start_date","end_date");