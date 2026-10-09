import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const customersTable = pgTable("gk_customers", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  paymentTerms: text("payment_terms").notNull().default("Due on receipt"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
