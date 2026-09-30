import { integer, pgTable, varchar, text, timestamp, numeric, boolean, uuid} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";

export const recommendationsTable = pgTable("recommendation", {
  id: uuid().defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" }),
  saleId: integer("sale_id")
    .references(() => salesTable.id, { onDelete: "cascade" }),
});

export const salesTable = pgTable("sale", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  source: text().notNull(),
  name: text().notNull(),
  url: text().notNull(),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
  imageUrl: text('image_url'),
  hostedImageUrl: text('hosted_image_url'),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  colors: text().array().notNull().default(sql`'{}'::text[]`),
  department: varchar({ length: 50 }).notNull(),
  isActive: boolean('is_active').notNull().default(true)
});
