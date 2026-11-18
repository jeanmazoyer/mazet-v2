CREATE TABLE "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booked_on" date NOT NULL,
	"label" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"account" text,
	"external_key" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_lines" ADD COLUMN "bank_transaction_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_transactions_external_key" ON "bank_transactions" USING btree ("external_key");--> statement-breakpoint
CREATE INDEX "bank_transactions_amount_idx" ON "bank_transactions" USING btree ("amount_cents");--> statement-breakpoint
ALTER TABLE "payment_lines" ADD CONSTRAINT "payment_lines_bank_transaction_id_bank_transactions_id_fk" FOREIGN KEY ("bank_transaction_id") REFERENCES "public"."bank_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_lines_bank_transaction_key" ON "payment_lines" USING btree ("bank_transaction_id");