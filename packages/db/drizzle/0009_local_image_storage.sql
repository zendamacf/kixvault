CREATE TYPE "sneaker_image_fetch_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
ALTER TABLE "sneaker_images" RENAME COLUMN "url" TO "source_url";--> statement-breakpoint
ALTER TABLE "sneaker_images" ADD COLUMN "storage_path" text;--> statement-breakpoint
ALTER TABLE "sneaker_images" ADD COLUMN "fetch_status" "sneaker_image_fetch_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "sneaker_images" ADD COLUMN "fetch_error" text;--> statement-breakpoint
ALTER TABLE "sneaker_images" ADD COLUMN "fetched_at" timestamp with time zone;
