import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { ListUsersResponse, UpdateUserBody, UpdateUserParams, UpdateUserResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { appUsersTable, customersTable } from "@workspace/db";
import { ApiError, parseInput, requireAdmin, requireAuth, requireProfile } from "../lib/http";

const router: IRouter = Router();
const admin = [requireAuth, requireProfile, requireAdmin];

function userDto(user: typeof appUsersTable.$inferSelect) {
  return { ...user, createdAt: user.createdAt.toISOString() };
}

router.get("/users", ...admin, async (_req, res) => {
  const users = await db.select().from(appUsersTable).orderBy(appUsersTable.createdAt);
  res.json(ListUsersResponse.parse(users.map(userDto)));
});

router.patch("/users/:id", ...admin, async (req, res) => {
  const params = parseInput(UpdateUserParams, req.params, res);
  const input = parseInput(UpdateUserBody, req.body, res);
  if (!params || !input) return;
  const updated = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(7512410)`);
    const [target] = await tx.select().from(appUsersTable).where(eq(appUsersTable.id, params.id)).limit(1);
    if (!target) throw new ApiError(404, "User not found.");
    if ((input.role === "admin" || input.role === "staff") && input.customerId != null) {
      throw new ApiError(400, "Only customer accounts can be linked to a business customer.");
    }
    const customerId = input.customerId === undefined ? target.customerId : input.customerId;
    const role = input.role ?? target.role;
    if (role === "customer" && customerId != null) {
      const [customer] = await tx.select({ id: customersTable.id }).from(customersTable).where(eq(customersTable.id, customerId)).limit(1);
      if (!customer) throw new ApiError(404, "Business customer not found.");
    }
    if (target.role === "admin" && role !== "admin") {
      const admins = await tx.select({ id: appUsersTable.id }).from(appUsersTable).where(eq(appUsersTable.role, "admin"));
      if (admins.length <= 1) throw new ApiError(409, "The last administrator cannot be demoted.");
    }
    const [saved] = await tx
      .update(appUsersTable)
      .set({ role, customerId: role === "customer" ? customerId : null, updatedAt: new Date() })
      .where(eq(appUsersTable.id, params.id))
      .returning();
    return saved;
  });
  res.json(UpdateUserResponse.parse(userDto(updated)));
});

export default router;
