import type { ErrorRequestHandler, Response } from "express";
import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { appUsersTable } from "@workspace/db";
import { logger } from "./logger";

export type Actor = typeof appUsersTable.$inferSelect;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const clerkUserId = getAuth(req).userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  res.locals.clerkUserId = clerkUserId;
  next();
};

export const requireProfile: RequestHandler = async (req, res, next) => {
  try {
    const clerkUserId = res.locals.clerkUserId as string | undefined;
    if (!clerkUserId) throw new ApiError(401, "Sign in to continue.");
    const [actor] = await db
      .select()
      .from(appUsersTable)
      .where(eq(appUsersTable.clerkUserId, clerkUserId))
      .limit(1);
    if (!actor) throw new ApiError(409, "Complete your profile before continuing.");
    res.locals.actor = actor;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireStaff: RequestHandler = (_req, res, next) => {
  const actor = res.locals.actor as Actor | undefined;
  if (!actor || !["admin", "staff"].includes(actor.role)) {
    res.status(actor ? 403 : 401).json({ error: "Staff access is required." });
    return;
  }
  next();
};

export const requireAdmin: RequestHandler = (_req, res, next) => {
  const actor = res.locals.actor as Actor | undefined;
  if (!actor || actor.role !== "admin") {
    res.status(actor ? 403 : 401).json({ error: "Administrator access is required." });
    return;
  }
  next();
};

export function actorFrom(res: Response): Actor {
  const actor = res.locals.actor as Actor | undefined;
  if (!actor) throw new ApiError(401, "Sign in to continue.");
  return actor;
}

export function parseInput<T>(
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: { issues: unknown[] } } },
  input: unknown,
  res: Response,
): T | null {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the submitted fields.", details: parsed.error.issues });
    return null;
  }
  return parsed.data;
}

export const apiErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if ((error as { code?: string })?.code === "23505") {
    res.status(409).json({ error: "That value is already in use." });
    return;
  }
  logger.error({ err: error }, "API request failed");
  res.status(500).json({ error: "The request could not be completed." });
};

export function canAccessCustomer(actor: Actor, customerId: number): boolean {
  return actor.role !== "customer" || actor.customerId === customerId;
}

export function ensureCustomerAccess(actor: Actor, customerId: number): void {
  if (!canAccessCustomer(actor, customerId)) {
    throw new ApiError(403, "You can only access your own business account.");
  }
}

export function ensureStaff(actor: Actor): void {
  if (actor.role === "customer") throw new ApiError(403, "Staff access is required.");
}

export function notFound(res: Response, message: string): void {
  res.status(404).json({ error: message });
}

export function emptyResult<T>(rows: T[], res: Response): T[] {
  if (!rows) return [];
  return rows;
}

export function isDuplicateSkuError(error: unknown): boolean {
  return (error as { code?: string })?.code === "23505";
}
