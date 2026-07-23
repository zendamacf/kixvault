ALTER TABLE "sneakers" ADD COLUMN "primary_image_id" uuid;--> statement-breakpoint
ALTER TABLE "sneakers" ADD CONSTRAINT "sneakers_primary_image_id_sneaker_images_id_fk" FOREIGN KEY ("primary_image_id") REFERENCES "public"."sneaker_images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sneakers_primary_image_id_unique" ON "sneakers" USING btree ("primary_image_id");--> statement-breakpoint
CREATE TABLE "sneaker_gallery_360_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sneaker_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"storage_path" text,
	"fetch_status" "sneaker_image_fetch_status" DEFAULT 'pending' NOT NULL,
	"fetch_error" text,
	"fetched_at" timestamp with time zone,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sneaker_gallery_360_images" ADD CONSTRAINT "sneaker_gallery_360_images_sneaker_id_sneakers_id_fk" FOREIGN KEY ("sneaker_id") REFERENCES "public"."sneakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sneaker_gallery_360_images_sneaker_id_idx" ON "sneaker_gallery_360_images" USING btree ("sneaker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sneaker_gallery_360_images_sneaker_id_sort_order_unique" ON "sneaker_gallery_360_images" USING btree ("sneaker_id","sort_order");
