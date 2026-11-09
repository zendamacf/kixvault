CREATE TABLE "sneaker_wears" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sneaker_id" uuid NOT NULL,
	"worn_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sneaker_wears_sneaker_id_worn_on_unique" UNIQUE("sneaker_id","worn_on")
);
--> statement-breakpoint
ALTER TABLE "sneaker_wears" ADD CONSTRAINT "sneaker_wears_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sneaker_wears" ADD CONSTRAINT "sneaker_wears_sneaker_id_sneakers_id_fk" FOREIGN KEY ("sneaker_id") REFERENCES "public"."sneakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sneaker_wears_user_id_worn_on_idx" ON "sneaker_wears" USING btree ("user_id","worn_on");
