import { customersTable } from "./customers";
import type { SavedOrderLine } from "./orders";
import { integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const quotationsTable = pgTable("gk_quotations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  createdBy: text("created_by").notNull(),
  status: text("status", { enum: ["requested", "quoted", "accepted", "rejected"] }).notNull().default("requested"),
  items: jsonb("items").$type<SavedOrderLine[]>().notNull(),
  total: numeric("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
