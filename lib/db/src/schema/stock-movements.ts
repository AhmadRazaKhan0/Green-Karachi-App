import { productsTable } from "./products";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const stockMovementsTable = pgTable("gk_stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  type: text("type", { enum: ["received", "sold", "damaged", "adjustment"] }).notNull(),
  quantity: integer("quantity").notNull(),
  note: text("note"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
