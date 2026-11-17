CREATE TYPE "public"."reservation_kind" AS ENUM('option', 'firm');--> statement-breakpoint
CREATE TYPE "public"."reservation_state" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"kind" "reservation_kind" NOT NULL,
	"state" "reservation_state" DEFAULT 'active' NOT NULL,
	"option_expires_at" timestamp with time zone,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_dates_ordered" CHECK ("reservations"."end_date" >= "reservations"."start_date"),
	CONSTRAINT "reservations_option_has_expiry" CHECK ("reservations"."kind" <> 'option' OR "reservations"."option_expires_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reservations_dates_idx" ON "reservations" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "reservations_deal_idx" ON "reservations" USING btree ("deal_id");