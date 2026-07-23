WITH "keepers" AS (
	SELECT DISTINCT ON ("si"."sneaker_id") "si"."id"
	FROM "sneaker_images" AS "si"
	LEFT JOIN "sneakers" AS "s" ON "s"."id" = "si"."sneaker_id"
	ORDER BY "si"."sneaker_id",
		CASE WHEN "si"."id" = "s"."primary_image_id" THEN 0 ELSE 1 END,
		"si"."sort_order" ASC
)
DELETE FROM "sneaker_images"
WHERE "id" NOT IN (SELECT "id" FROM "keepers");--> statement-breakpoint
UPDATE "sneakers" AS "s"
SET "primary_image_id" = "si"."id"
FROM "sneaker_images" AS "si"
WHERE "si"."sneaker_id" = "s"."id" AND "s"."primary_image_id" IS NULL;--> statement-breakpoint
DROP INDEX "sneaker_images_sneaker_id_sort_order_unique";--> statement-breakpoint
ALTER TABLE "sneaker_images" DROP COLUMN "sort_order";--> statement-breakpoint
CREATE UNIQUE INDEX "sneaker_images_sneaker_id_unique" ON "sneaker_images" USING btree ("sneaker_id");
