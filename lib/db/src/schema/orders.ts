import { customersTable } from "./customers";
import { jsonb, numeric, pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export type SavedOrderLine = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export const ordersTable = pgTable("gk_orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  createdBy: text("created_by").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "processing", "fulfilled", "cancelled"] }).notNull().default("pending"),
  items: jsonb("items").$type<SavedOrderLine[]>().notNull(),
  total: numeric("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
