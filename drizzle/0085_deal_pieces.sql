CREATE TYPE "public"."deal_piece_kind" AS ENUM('quote_sent', 'contract_signed', 'deposit_invoice', 'deposit_received', 'balance_invoice', 'balance_received', 'deposit_hold', 'insurance_certificate');--> statement-breakpoint
CREATE TYPE "public"."deal_piece_status" AS ENUM('missing', 'received', 'verified');--> statement-breakpoint
CREATE TABLE "deal_pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"kind" "deal_piece_kind" NOT NULL,
	"status" "deal_piece_status" DEFAULT 'missing' NOT NULL,
	"reference" text,
	"expires_on" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deal_pieces" ADD CONSTRAINT "deal_pieces_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deal_pieces_deal_kind_key" ON "deal_pieces" USING btree ("deal_id","kind");