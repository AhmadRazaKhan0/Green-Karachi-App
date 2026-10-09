import { Router, type IRouter } from "express";
import { and, desc, eq, gte } from "drizzle-orm";
import { GetDashboardResponse, GetReportsResponse, ListStockMovementsResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { customersTable, invoicesTable, ordersTable, paymentsTable, productsTable, stockMovementsTable } from "@workspace/db";
import { actorFrom, requireAuth, requireProfile, requireStaff } from "../lib/http";

const router: IRouter = Router();
const signedIn = [requireAuth, requireProfile];
const staff = [...signedIn, requireStaff];

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function movementDto(movement: typeof stockMovementsTable.$inferSelect, productName: string) {
  return { ...movement, productName, createdAt: movement.createdAt.toISOString() };
}

router.get("/dashboard", ...signedIn, async (_req, res) => {
  const actor = actorFrom(res);
  const products = await db.select().from(productsTable).where(eq(productsTable.isActive, true));
  const customerConditions = actor.role === "customer" ? eq(customersTable.id, actor.customerId ?? -1) : undefined;
  const customerRows = await db.select({ id: customersTable.id }).from(customersTable).where(customerConditions);
  const orderRows = await db
    .select()
    .from(ordersTable)
    .where(actor.role === "customer" ? eq(ordersTable.customerId, actor.customerId ?? -1) : undefined);
  const monthStartDate = monthStart(new Date());
  const thisMonthOrders = orderRows.filter((order) => order.status === "fulfilled" && order.updatedAt >= monthStartDate);
  const invoiceRows = await db
    .select()
    .from(invoicesTable)
    .where(actor.role === "customer" ? eq(invoicesTable.customerId, actor.customerId ?? -1) : undefined);
  let outstandingPayments = 0;
  for (const invoice of invoiceRows) {
    const payments = await db
      .select({ amount: paymentsTable.amount })
      .from(paymentsTable)
      .where(eq(paymentsTable.invoiceId, invoice.id));
    outstandingPayments += Math.max(0, invoice.total - payments.reduce((sum, row) => sum + row.amount, 0));
  }
  const movements = await db
    .select({ movement: stockMovementsTable, productName: productsTable.name })
    .from(stockMovementsTable)
    .innerJoin(productsTable, eq(stockMovementsTable.productId, productsTable.id))
    .orderBy(desc(stockMovementsTable.createdAt))
    .limit(6);
  const plants = products.filter((product) => /plant|tree|sapling|seed/i.test(product.category));
  const payload = {
    totalProducts: products.length,
    plantProducts: plants.length,
    supplyProducts: products.length - plants.length,
    lowStockItems: products.filter((product) => product.physicalStock - product.reservedStock <= product.minimumStock).length,
    outOfStockItems: products.filter((product) => product.physicalStock - product.reservedStock <= 0).length,
    totalCustomers: customerRows.length,
    pendingOrders: orderRows.filter((order) => ["pending", "confirmed", "processing"].includes(order.status)).length,
    monthlySales: Math.round(thisMonthOrders.reduce((sum, order) => sum + order.total, 0) * 100) / 100,
    outstandingPayments: Math.round(outstandingPayments * 100) / 100,
    recentMovements: ListStockMovementsResponse.parse(movements.map(({ movement, productName }) => movementDto(movement, productName))),
  };
  res.json(GetDashboardResponse.parse(payload));
});

router.get("/reports", ...staff, async (_req, res) => {
  const products = await db.select().from(productsTable).where(eq(productsTable.isActive, true));
  const categories = new Map<string, { products: number; unitsAvailable: number }>();
  for (const product of products) {
    const current = categories.get(product.category) ?? { products: 0, unitsAvailable: 0 };
    current.products += 1;
    current.unitsAvailable += product.physicalStock - product.reservedStock;
    categories.set(product.category, current);
  }

  const sixMonthsAgo = monthStart(new Date());
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5);
  const fulfilledOrders = await db
    .select({ order: ordersTable, customerName: customersTable.businessName })
    .from(ordersTable)
    .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .where(and(eq(ordersTable.status, "fulfilled"), gte(ordersTable.updatedAt, sixMonthsAgo)));
  const months = new Map<string, number>();
  for (let offset = 0; offset < 6; offset++) {
    const date = new Date(sixMonthsAgo);
    date.setUTCMonth(date.getUTCMonth() + offset);
    months.set(date.toISOString().slice(0, 7), 0);
  }
  const customerTotals = new Map<number, { customerName: string; sales: number }>();
  for (const { order, customerName } of fulfilledOrders) {
    const month = order.updatedAt.toISOString().slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + order.total);
    const customer = customerTotals.get(order.customerId) ?? { customerName, sales: 0 };
    customer.sales += order.total;
    customerTotals.set(order.customerId, customer);
  }
  const payload = {
    monthlySales: [...months.entries()].map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 })),
    inventoryByCategory: [...categories.entries()].map(([category, values]) => ({ category, ...values })),
    topCustomers: [...customerTotals.entries()]
      .map(([customerId, values]) => ({ customerId, ...values, sales: Math.round(values.sales * 100) / 100 }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10),
  };
  res.json(GetReportsResponse.parse(payload));
});

export default router;
