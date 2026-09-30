UPDATE "user" AS u
SET "user_style" = p."preferences"
FROM "preferences" AS p
WHERE u."id" = p."user_id"
  AND u."user_style" IS NULL
  AND p."preferences" <> '';
--> statement-breakpoint
DROP TABLE "preferences";
--> statement-breakpoint
CREATE TABLE "recommendation" (
	"id" uuid PRIMARY KEY,
	"user_id" text,
	"sale_id" integer,
	CONSTRAINT "recommendation_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
	CONSTRAINT "recommendation_sale_id_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sale"("id") ON DELETE CASCADE
);
