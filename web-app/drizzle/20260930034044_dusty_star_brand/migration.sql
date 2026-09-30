CREATE TYPE "department" AS ENUM('men', 'women');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "department" "department";