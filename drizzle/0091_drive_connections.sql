CREATE TABLE "drive_connections" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"account_email" text NOT NULL,
	"refresh_token_enc" "bytea" NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drive_connections" ADD CONSTRAINT "drive_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;