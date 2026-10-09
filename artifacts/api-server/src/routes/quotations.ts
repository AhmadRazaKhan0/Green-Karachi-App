import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  CreateQuotationBody,
  ListQuotationsResponse,
  UpdateQuotationStatusBody,
  UpdateQuotationStatusParams,
  UpdateQuotationStatusResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { customersTable, productsTable, quotationsTable } from "@workspace/db";
import type { SavedOrderLine } from "@workspace/db";
import { actorFrom, ApiError, ensureCustomerAccess, parseInput, requireAuth, requireProfile, requireStaff } from "../lib/http";

const router: IRouter = Router();
const signedIn = [requireAuth, requireProfile];
const staff = [...signedIn, requireStaff];

function quotationDto(quotation: typeof quotationsTable.$inferSelect, customerName: string) {
  return { ...quotation, customerName, createdAt: quotation.createdAt.toISOString() };
}

router.get("/quotations", ...signedIn, async (_req, res) => {
  const actor = actorFrom(res);
  const rows = await db
    .select({ quotation: quotationsTable, customerName: customersTable.businessName })
    .from(quotationsTable)
    .innerJoin(customersTable, eq(quotationsTable.customerId, customersTable.id))
    .where(actor.role === "customer" ? eq(quotationsTable.customerId, actor.customerId ?? -1) : undefined)
    .orderBy(desc(quotationsTable.createdAt))
    .limit(250);
  res.json(ListQuotationsResponse.parse(rows.map(({ quotation, customerName }) => quotationDto(quotation, customerName))));
});

router.post("/quotations", ...signedIn, async (req, res) => {
  const input = parseInput(CreateQuotationBody, req.body, res);
  if (!input) return;
  const actor = actorFrom(res);
  const customerId = actor.role === "customer" ? actor.customerId : input.customerId;
  if (!customerId) throw new ApiError(403, "Link your account to a business customer before requesting a quotation.");
  if (actor.role === "customer" && input.customerId !== customerId) {
    throw new ApiError(403, "You can only request a quotation for your own business account.");
  }
  const result = await db.transaction(async (tx) => {
    const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, customerId)).limit(1);
    if (!customer || !customer.isActive) throw new ApiError(404, "Active business customer not found.");
    const quantities = new Map<number, number>();
    for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    const lines: SavedOrderLine[] = [];
    let total = 0;
    for (const [productId, quantity] of [...quantities.entries()].sort(([a], [b]) => a - b)) {
      const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
      if (!product || !product.isActive) throw new ApiError(404, "One of the selected products is unavailable.");
      const lineTotal = Math.round(product.unitPrice * quantity * 100) / 100;
      total += lineTotal;
      lines.push({ productId, productName: product.name, quantity, unitPrice: product.unitPrice, lineTotal });
    }
    const [quotation] = await tx
      .insert(quotationsTable)
      .values({
        customerId,
        createdBy: actor.clerkUserId,
        items: lines,
        total: Math.round(total * 100) / 100,
        notes: input.notes?.trim() || null,
      })
      .returning();
    return quotationDto(quotation, customer.businessName);
  });
  res.status(201).json(UpdateQuotationStatusResponse.parse(result));
});

router.patch("/quotations/:id/status", ...signedIn, async (req, res) => {
  const params = parseInput(UpdateQuotationStatusParams, req.params, res);
  const input = parseInput(UpdateQuotationStatusBody, req.body, res);
  if (!params || !input) return;
  const actor = actorFrom(res);
  const [quotation] = await db.select().from(quotationsTable).where(eq(quotationsTable.id, params.id)).limit(1);
  if (!quotation) throw new ApiError(404, "Quotation not found.");
  ensureCustomerAccess(actor, quotation.customerId);
  if (actor.role === "customer") {
    if (quotation.status !== "quoted" || !["accepted", "rejected"].includes(input.status)) {
      throw new ApiError(403, "Customers can accept or reject a quotation after it has been priced.");
    }
  }
  const [saved] = await db
    .update(quotationsTable)
    .set({
      status: input.status,
      notes: input.notes?.trim() || quotation.notes,
      updatedAt: new Date(),
    })
    .where(eq(quotationsTable.id, quotation.id))
    .returning();
  const [customer] = await db
    .select({ businessName: customersTable.businessName })
    .from(customersTable)
    .where(eq(customersTable.id, quotation.customerId))
    .limit(1);
  res.json(UpdateQuotationStatusResponse.parse(quotationDto(saved, customer?.businessName ?? "Business customer")));
});

export default router;
