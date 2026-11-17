CREATE TYPE "public"."contract_nature" AS ENUM('stay', 'event');--> statement-breakpoint
CREATE TYPE "public"."contract_party_role" AS ENUM('tenant_1', 'tenant_2');--> statement-breakpoint
CREATE TABLE "contract_parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"role" "contract_party_role" NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"id_number" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_terms" (
	"deal_id" uuid PRIMARY KEY NOT NULL,
	"nature" "contract_nature" NOT NULL,
	"occupants" integer NOT NULL,
	"arrival_time" text NOT NULL,
	"departure_time" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_terms_occupants_positive" CHECK ("contract_terms"."occupants" > 0)
);
--> statement-breakpoint
ALTER TABLE "contract_parties" ADD CONSTRAINT "contract_parties_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_terms" ADD CONSTRAINT "contract_terms_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contract_parties_deal_role_key" ON "contract_parties" USING btree ("deal_id","role");