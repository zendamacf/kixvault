ALTER TABLE "users" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"currency" text PRIMARY KEY NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
