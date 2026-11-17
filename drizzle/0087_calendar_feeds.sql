CREATE TABLE "calendar_feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservations" ALTER COLUMN "deal_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "feed_id" uuid;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "external_uid" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_feed_id_calendar_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."calendar_feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_feed_uid_key" ON "reservations" USING btree ("feed_id","external_uid");--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_one_source" CHECK (("reservations"."deal_id" IS NOT NULL AND "reservations"."feed_id" IS NULL AND "reservations"."external_uid" IS NULL) OR ("reservations"."deal_id" IS NULL AND "reservations"."feed_id" IS NOT NULL AND "reservations"."external_uid" IS NOT NULL));