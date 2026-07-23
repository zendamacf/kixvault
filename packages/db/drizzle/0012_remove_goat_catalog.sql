UPDATE "sneakers"
SET "catalog_source" = NULL, "catalog_id" = NULL
WHERE "catalog_source" = 'kicksdb:goat';--> statement-breakpoint
DELETE FROM "catalog_product_cache"
WHERE "catalog_source" = 'kicksdb:goat';--> statement-breakpoint
DELETE FROM "catalog_market_prices"
WHERE "catalog_source" = 'kicksdb:goat';--> statement-breakpoint
DELETE FROM "price_snapshots"
WHERE "catalog_source" = 'kicksdb:goat';
