CREATE TABLE "sneaker_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sneaker_id" uuid NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sneaker_images" ADD CONSTRAINT "sneaker_images_sneaker_id_sneakers_id_fk" FOREIGN KEY ("sneaker_id") REFERENCES "public"."sneakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sneaker_images_sneaker_id_idx" ON "sneaker_images" USING btree ("sneaker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sneaker_images_sneaker_id_sort_order_unique" ON "sneaker_images" USING btree ("sneaker_id","sort_order");--> statement-breakpoint
INSERT INTO "sneaker_images" ("sneaker_id", "url", "sort_order")
SELECT "id", "image_url", 0
FROM "sneakers"
WHERE "image_url" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "sneakers" DROP COLUMN "image_url";
