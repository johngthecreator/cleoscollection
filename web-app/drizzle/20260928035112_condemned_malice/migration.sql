CREATE TABLE "sale" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sale_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL,
	"image_url" text,
	"current_price" numeric(10,2) NOT NULL,
	"original_price" numeric(10,2) NOT NULL,
	"colors" text[] DEFAULT '{}'::text[] NOT NULL,
	"department" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
