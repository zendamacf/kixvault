CREATE TYPE "public"."departure_type" AS ENUM('sold', 'donated', 'gifted', 'traded', 'lost', 'other');--> statement-breakpoint
ALTER TABLE "sneakers" ADD COLUMN "departure_type" "departure_type";--> statement-breakpoint
ALTER TABLE "sneakers" ADD COLUMN "departed_on" date;--> statement-breakpoint
ALTER TABLE "sneakers" ADD COLUMN "sale_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sneakers" ADD COLUMN "departure_notes" text;--> statement-breakpoint
CREATE INDEX "sneakers_user_id_departure_type_idx" ON "sneakers" USING btree ("user_id","departure_type");
