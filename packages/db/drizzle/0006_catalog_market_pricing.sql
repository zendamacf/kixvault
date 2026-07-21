CREATE TABLE "catalog_product_cache" (
	"catalog_source" text NOT NULL,
	"catalog_id" text NOT NULL,
	"sku" text NOT NULL,
	"variant_prices" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "catalog_product_cache_catalog_source_catalog_id_pk" PRIMARY KEY("catalog_source","catalog_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_market_prices" (
	"catalog_source" text NOT NULL,
	"sku" text NOT NULL,
	"size" numeric(4, 1) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"priced_at" timestamp with time zone NOT NULL,
	"variant_id" text,
	CONSTRAINT "catalog_market_prices_catalog_source_sku_size_pk" PRIMARY KEY("catalog_source","sku","size")
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_source" text NOT NULL,
	"sku" text NOT NULL,
	"size" numeric(4, 1) NOT NULL,
	"snapshot_date" date NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	CONSTRAINT "price_snapshots_catalog_source_sku_size_snapshot_date_unique" UNIQUE("catalog_source","sku","size","snapshot_date")
);
