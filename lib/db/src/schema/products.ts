import { boolean, integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const productsTable = pgTable(
  "gk_products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    category: text("category").notNull(),
    unit: text("unit").notNull().default("piece"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    physicalStock: integer("physical_stock").notNull().default(0),
    reservedStock: integer("reserved_stock").notNull().default(0),
    minimumStock: integer("minimum_stock").notNull().default(0),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("gk_products_sku_idx").on(table.sku)],
);
