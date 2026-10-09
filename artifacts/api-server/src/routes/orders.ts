import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  CreateOrderBody,
  ListOrdersResponse,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { appUsersTable, customersTable, ordersTable, productsTable, stockMovementsTable } from "@workspace/db";
import type { SavedOrderLine } from "@workspace/db";
import {
  actorFrom,
  ApiError,
  ensureCustomerAccess,
  parseInput,
  requireAuth,
  requireProfile,
  requireStaff,
} from "../lib/http";

const router: IRouter = Router();
const signedIn = [requireAuth, requireProfile];
const staff = [...signedIn, requireStaff];

function orderDto(
  order: typeof ordersTable.$inferSelect,
  customerName: string,
) {
  return {
    ...order,
    customerName,
    createdAt: order.createdAt.toISOString(),
  };
}

router.get("/orders", ...signedIn, async (_req, res) => {
  const actor = actorFrom(res);
  const rows = await db
    .select({ order: ordersTable, customerName: customersTable.businessName })
    .from(ordersTable)
    .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .where(actor.role === "customer" ? eq(ordersTable.customerId, actor.customerId ?? -1) : undefined)
    .orderBy(desc(ordersTable.createdAt))
    .limit(250);
  res.json(ListOrdersResponse.parse(rows.map(({ order, customerName }) => orderDto(order, customerName))));
});

router.post("/orders", ...signedIn, async (req, res) => {
  const input = parseInput(CreateOrderBody, req.body, res);
  if (!input) return;
  const actor = actorFrom(res);
  const customerId = actor.role === "customer" ? actor.customerId : input.customerId;
  if (!customerId) throw new ApiError(403, "Link your account to a business customer before placing an order.");
  if (actor.role === "customer" && input.customerId !== customerId) {
    throw new ApiError(403, "You can only place orders for your own business account.");
  }
  const created = await db.transaction(async (tx) => {
    const [customer] = await tx
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .for("update")
      .limit(1);
    if (!customer || !customer.isActive) throw new ApiError(404, "Active business customer not found.");

    const quantities = new Map<number, number>();
    for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    const lines: SavedOrderLine[] = [];
    let total = 0;
    for (const [productId, quantity] of [...quantities.entries()].sort(([a], [b]) => a - b)) {
      const [product] = await tx
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .for("update")
        .limit(1);
      if (!product || !product.isActive) throw new ApiError(404, "One of the selected products is unavailable.");
      const available = product.physicalStock - product.reservedStock;
      if (available < quantity) {
        throw new ApiError(409, `${product.name} has only ${available} ${product.unit} available.`);
      }
      const lineTotal = Math.round(product.unitPrice * quantity * 100) / 100;
      total += lineTotal;
      lines.push({ productId, productName: product.name, quantity, unitPrice: product.unitPrice, lineTotal });
      await tx
        .update(productsTable)
        .set({ reservedStock: product.reservedStock + quantity, updatedAt: new Date() })
        .where(eq(productsTable.id, productId));
    }
    const [order] = await tx
      .insert(ordersTable)
      .values({
        customerId,
        createdBy: actor.clerkUserId,
        items: lines,
        total: Math.round(total * 100) / 100,
        notes: input.notes?.trim() || null,
      })
      .returning();
    return { order, customerName: customer.businessName };
  });
  res.status(201).json(UpdateOrderStatusResponse.parse(orderDto(created.order, created.customerName)));
});

router.patch("/orders/:id/status", ...staff, async (req, res) => {
  const params = parseInput(UpdateOrderStatusParams, req.params, res);
  const input = parseInput(UpdateOrderStatusBody, req.body, res);
  if (!params || !input) return;
  const actor = actorFrom(res);
  const updated = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, params.id))
      .for("update")
      .limit(1);
    if (!order) throw new ApiError(404, "Order not found.");
    if (order.status === "cancelled" || order.status === "fulfilled") {
      throw new ApiError(409, "This order is already closed.");
    }
    if (input.status === "confirmed" && order.status !== "pending") throw new ApiError(409, "Only pending orders can be confirmed.");
    if (input.status === "processing" && order.status !== "confirmed") throw new ApiError(409, "Confirm the order before processing it.");
    if (input.status === "fulfilled" && !["confirmed", "processing"].includes(order.status)) {
      throw new ApiError(409, "Confirm the order before fulfilling it.");
    }
    if (input.status === "cancelled" || input.status === "fulfilled") {
      for (const line of order.items) {
        const [product] = await tx
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, line.productId))
          .for("update")
          .limit(1);
        if (!product || product.reservedStock < line.quantity) {
          throw new ApiError(409, "Stock reservation no longer matches this order. Please contact an administrator.");
        }
        const physicalStock = input.status === "fulfilled" ? product.physicalStock - line.quantity : product.physicalStock;
        if (physicalStock < 0) throw new ApiError(409, "Insufficient physical stock to fulfill this order.");
        await tx
          .update(productsTable)
          .set({
            physicalStock,
            reservedStock: product.reservedStock - line.quantity,
            updatedAt: new Date(),
          })
          .where(eq(productsTable.id, product.id));
        if (input.status === "fulfilled") {
          await tx.insert(stockMovementsTable).values({
            productId: product.id,
            type: "sold",
            quantity: -line.quantity,
            note: `Fulfilled order #${order.id}`,
            createdBy: actor.clerkUserId,
          });
        }
      }
    }
    const [saved] = await tx
      .update(ordersTable)
      .set({ status: input.status, updatedAt: new Date() })
      .where(eq(ordersTable.id, order.id))
      .returning();
    const [customer] = await tx
      .select({ businessName: customersTable.businessName })
      .from(customersTable)
      .where(eq(customersTable.id, order.customerId))
      .limit(1);
    return orderDto(saved, customer?.businessName ?? "Business customer");
  });
  res.json(UpdateOrderStatusResponse.parse(updated));
});

export default router;
