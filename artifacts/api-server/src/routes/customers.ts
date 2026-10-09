import { Router, type IRouter } from "express";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import {
  CreateCustomerBody,
  ListCustomersQueryParams,
  ListCustomersResponse,
  UpdateCustomerBody,
  UpdateCustomerParams,
  UpdateCustomerResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { appUsersTable, customersTable } from "@workspace/db";
import { ApiError, actorFrom, ensureCustomerAccess, parseInput, requireAuth, requireProfile, requireStaff } from "../lib/http";

const router: IRouter = Router();
const staff = [requireAuth, requireProfile, requireStaff];
const signedIn = [requireAuth, requireProfile];

function customerDto(customer: typeof customersTable.$inferSelect) {
  return { ...customer, createdAt: customer.createdAt.toISOString() };
}

router.get("/customers", ...signedIn, async (req, res) => {
  const actor = actorFrom(res);
  const params = parseInput(ListCustomersQueryParams, req.query, res);
  if (!params) return;
  if (actor.role === "customer") {
    if (!actor.customerId) {
      res.json([]);
      return;
    }
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, actor.customerId))
      .limit(1);
    res.json(ListCustomersResponse.parse(customer ? [customerDto(customer)] : []));
    return;
  }
  const search = params.search?.trim();
  const rows = await db
    .select()
    .from(customersTable)
    .where(search
      ? or(
        ilike(customersTable.businessName, `%${search}%`),
        ilike(customersTable.contactName, `%${search}%`),
        ilike(customersTable.email, `%${search}%`),
      )
      : undefined)
    .orderBy(asc(customersTable.businessName));
  res.json(ListCustomersResponse.parse(rows.map(customerDto)));
});

router.post("/customers", ...staff, async (req, res) => {
  const input = parseInput(CreateCustomerBody, req.body, res);
  if (!input) return;
  const [customer] = await db
    .insert(customersTable)
    .values({
      ...input,
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      address: input.address ?? "",
    })
    .returning();
  res.status(201).json(UpdateCustomerResponse.parse(customerDto(customer)));
});

router.patch("/customers/:id", ...staff, async (req, res) => {
  const params = parseInput(UpdateCustomerParams, req.params, res);
  const input = parseInput(UpdateCustomerBody, req.body, res);
  if (!params || !input) return;
  const [customer] = await db
    .update(customersTable)
    .set({
      ...input,
      email: input.email?.trim().toLowerCase(),
      updatedAt: new Date(),
    })
    .where(eq(customersTable.id, params.id))
    .returning();
  if (!customer) throw new ApiError(404, "Customer not found.");
  res.json(UpdateCustomerResponse.parse(customerDto(customer)));
});

export default router;
