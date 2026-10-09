import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, desc, eq, gte } from "drizzle-orm";
import {
  CreateInvoiceBody,
  ListInvoicesResponse,
  RecordPaymentBody,
  RecordPaymentParams,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { customersTable, invoicesTable, ordersTable, paymentsTable } from "@workspace/db";
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

async function invoiceDto(invoice: typeof invoicesTable.$inferSelect, customerName: string) {
  const payments = await db
    .select({ amount: paymentsTable.amount })
    .from(paymentsTable)
    .where(eq(paymentsTable.invoiceId, invoice.id));
  const amountPaid = Math.round(payments.reduce((sum, payment) => sum + payment.amount, 0) * 100) / 100;
  const outstanding = Math.max(0, Math.round((invoice.total - amountPaid) * 100) / 100);
  const isOverdue = outstanding > 0 && invoice.dueDate < new Date().toISOString().slice(0, 10);
  const status = isOverdue ? "overdue" : outstanding <= 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
  return {
    ...invoice,
    customerName,
    amountPaid,
    outstanding,
    status,
    createdAt: invoice.createdAt.toISOString(),
  };
}

router.get("/invoices", ...signedIn, async (_req, res) => {
  const actor = actorFrom(res);
  const rows = await db
    .select({ invoice: invoicesTable, customerName: customersTable.businessName })
    .from(invoicesTable)
    .innerJoin(customersTable, eq(invoicesTable.customerId, customersTable.id))
    .where(actor.role === "customer" ? eq(invoicesTable.customerId, actor.customerId ?? -1) : undefined)
    .orderBy(desc(invoicesTable.createdAt))
    .limit(250);
  const invoices = await Promise.all(rows.map(({ invoice, customerName }) => invoiceDto(invoice, customerName)));
  res.json(ListInvoicesResponse.parse(invoices));
});

router.post("/invoices", ...staff, async (req, res) => {
  const input = parseInput(CreateInvoiceBody, req.body, res);
  if (!input) return;
  const actor = actorFrom(res);
  const invoice = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, input.orderId))
      .for("update")
      .limit(1);
    if (!order) throw new ApiError(404, "Order not found.");
    if (order.status !== "fulfilled") throw new ApiError(409, "An invoice can only be created for a fulfilled order.");
    const [existing] = await tx
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.orderId, order.id))
      .limit(1);
    if (existing) throw new ApiError(409, "This order already has an invoice.");
    const invoiceNumber = `GK-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const [created] = await tx
      .insert(invoicesTable)
      .values({
        invoiceNumber,
        orderId: order.id,
        customerId: order.customerId,
        createdBy: actor.clerkUserId,
        total: order.total,
        dueDate: input.dueDate.toISOString().slice(0, 10),
      })
      .returning();
    return created;
  });
  const [customer] = await db
    .select({ businessName: customersTable.businessName })
    .from(customersTable)
    .where(eq(customersTable.id, invoice.customerId))
    .limit(1);
  res.status(201).json((await invoiceDto(invoice, customer?.businessName ?? "Business customer")));
});

router.post("/invoices/:id/payments", ...staff, async (req, res) => {
  const params = parseInput(RecordPaymentParams, req.params, res);
  const input = parseInput(RecordPaymentBody, req.body, res);
  if (!params || !input) return;
  const actor = actorFrom(res);
  const saved = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, params.id))
      .for("update")
      .limit(1);
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    const paymentRows = await tx
      .select({ amount: paymentsTable.amount })
      .from(paymentsTable)
      .where(eq(paymentsTable.invoiceId, invoice.id));
    const amountPaid = paymentRows.reduce((sum, payment) => sum + payment.amount, 0);
    const outstanding = Math.round((invoice.total - amountPaid) * 100) / 100;
    const amount = Math.round(input.amount * 100) / 100;
    if (amount > outstanding) throw new ApiError(409, `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}.`);
    await tx.insert(paymentsTable).values({
      invoiceId: invoice.id,
      amount,
      method: input.method,
      reference: input.reference?.trim() || "",
      recordedBy: actor.clerkUserId,
    });
    return invoice;
  });
  const [customer] = await db
    .select({ businessName: customersTable.businessName })
    .from(customersTable)
    .where(eq(customersTable.id, saved.customerId))
    .limit(1);
  res.status(201).json(await invoiceDto(saved, customer?.businessName ?? "Business customer"));
});

export default router;
