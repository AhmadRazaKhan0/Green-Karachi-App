import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { appUsersTable, customersTable } from "@workspace/db";
import { GetMeResponse, SaveMeBody, SaveMeResponse } from "@workspace/api-zod";
import { ApiError, parseInput, requireAuth } from "../lib/http";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res) => {
  const clerkUserId = getAuth(req).userId;
  if (!clerkUserId) throw new ApiError(401, "Sign in to continue.");
  const [user] = await db
    .select()
    .from(appUsersTable)
    .where(eq(appUsersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Profile not created yet." });
    return;
  }
  res.json(GetMeResponse.parse(user));
});

router.put("/me", requireAuth, async (req, res) => {
  const clerkUserId = getAuth(req).userId;
  if (!clerkUserId) throw new ApiError(401, "Sign in to continue.");
  const input = parseInput(SaveMeBody, req.body, res);
  if (!input) return;
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const user = await db.transaction(async (tx) => {
    // Serialize first-account setup so two simultaneous signups cannot both become admin.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(7512409)`);
    const [existing] = await tx
      .select()
      .from(appUsersTable)
      .where(eq(appUsersTable.clerkUserId, clerkUserId))
      .limit(1);
    if (existing) {
      const [updated] = await tx
        .update(appUsersTable)
        .set({ email, name, updatedAt: new Date() })
        .where(eq(appUsersTable.id, existing.id))
        .returning();
      return updated;
    }
    const [admin] = await tx
      .select({ id: appUsersTable.id })
      .from(appUsersTable)
      .where(eq(appUsersTable.role, "admin"))
      .limit(1);
    const [matchingCustomer] = await tx
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(eq(customersTable.email, email))
      .limit(1);
    const [created] = await tx
      .insert(appUsersTable)
      .values({
        clerkUserId,
        email,
        name,
        role: admin ? "customer" : "admin",
        customerId: matchingCustomer?.id ?? null,
      })
      .returning();
    return created;
  });
  res.json(SaveMeResponse.parse(user));
});

export default router;
