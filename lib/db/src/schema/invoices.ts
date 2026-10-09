import { customersTable } from "./customers";
import { ordersTable } from "./orders";
import { integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const invoicesTable = pgTable(
  "gk_invoices",
  {
    id: serial("id").primaryKey(),
    invoiceNumber: text("invoice_number").notNull(),
    orderId: integer("order_id").notNull().references(() => ordersTable.id),
    customerId: integer("customer_id").notNull().references(() => customersTable.id),
    createdBy: text("created_by").notNull(),
    total: numeric("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
    dueDate: text("due_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("gk_invoices_number_idx").on(table.invoiceNumber), uniqueIndex("gk_invoices_order_idx").on(table.orderId)],
);

export const paymentsTable = pgTable("gk_payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoicesTable.id),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  method: text("method", { enum: ["cash", "bank_transfer", "cheque", "other"] }).notNull(),
  reference: text("reference").notNull().default(""),
  recordedBy: text("recorded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
