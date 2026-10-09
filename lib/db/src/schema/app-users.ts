import { customersTable } from "./customers";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const appUsersTable = pgTable("gk_app_users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "staff", "customer"] }).notNull().default("customer"),
  customerId: integer("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type AppRole = "admin" | "staff" | "customer";
