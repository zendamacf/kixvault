CREATE TYPE "public"."pricing_refresh_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "pricing_refresh_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "pricing_refresh_status" NOT NULL,
	"products_refreshed" integer
);
