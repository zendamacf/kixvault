ALTER TABLE "sneakers" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("sneakers"."brand", '')), 'A') ||
              setweight(to_tsvector('english', coalesce("sneakers"."model", '')), 'A') ||
              setweight(to_tsvector('english', coalesce("sneakers"."colorway", '')), 'B') ||
              setweight(to_tsvector('simple', coalesce("sneakers"."sku", '')), 'A') ||
              setweight(to_tsvector('english', coalesce("sneakers"."notes", '')), 'C')) STORED NOT NULL;--> statement-breakpoint
CREATE INDEX "sneakers_search_vector_idx" ON "sneakers" USING gin ("search_vector");