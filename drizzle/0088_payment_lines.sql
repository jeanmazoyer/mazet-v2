CREATE TYPE "public"."payment_line_kind" AS ENUM('deposit', 'balance', 'hold');--> statement-breakpoint
CREATE TYPE "public"."payment_line_status" AS ENUM('due', 'paid', 'held', 'released');--> statement-breakpoint
CREATE TABLE "payment_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"kind" "payment_line_kind" NOT NULL,
	"status" "payment_line_status" NOT NULL,
	"amount_cents" integer NOT NULL,
	"due_on" date NOT NULL,
	"paid_on" date,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_lines_amount_positive" CHECK ("payment_lines"."amount_cents" > 0),
	CONSTRAINT "payment_lines_settled_has_day" CHECK ("payment_lines"."status" NOT IN ('paid', 'released') OR "payment_lines"."paid_on" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "payment_lines" ADD CONSTRAINT "payment_lines_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;