import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, lte, or, sql } from "drizzle-orm";
import {
  CreateProductBody,
  CreateStockMovementBody,
  ListProductsQueryParams,
  ListProductsResponse,
  ListStockMovementsResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { productsTable, stockMovementsTable } from "@workspace/db";
import { ApiError, actorFrom, parseInput, requireAuth, requireProfile, requireStaff } from "../lib/http";

const router: IRouter = Router();
const internal = [requireAuth, requireProfile, requireStaff];

function productDto(product: typeof productsTable.$inferSelect) {
  return {
    ...product,
    availableStock: product.physicalStock - product.reservedStock,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function movementDto(
  movement: typeof stockMovementsTable.$inferSelect,
  productName: string,
) {
  return {
    ...movement,
    productName,
    createdAt: movement.createdAt.toISOString(),
  };
}

router.get("/catalog", async (req, res) => {
  const params = parseInput(ListProductsQueryParams, req.query, res);
  if (!params) return;
  const conditions = [eq(productsTable.isActive, true)];
  if (params.search) conditions.push(ilike(productsTable.name, `%${params.search}%`));
  if (params.category) conditions.push(eq(productsTable.category, params.category));
  const rows = await db.select().from(productsTable).where(and(...conditions)).orderBy(productsTable.name);
  res.json(ListProductsResponse.parse(rows.map(productDto)));
});

router.get("/products", ...internal, async (req, res) => {
  const params = parseInput(ListProductsQueryParams, req.query, res);
  if (!params) return;
  const conditions = [];
  if (params.search) {
    conditions.push(or(
      ilike(productsTable.name, `%${params.search}%`),
      ilike(productsTable.sku, `%${params.search}%`),
    ));
  }
  if (params.category) conditions.push(eq(productsTable.category, params.category));
  if (params.stock === "low") conditions.push(lte(
    sql`${productsTable.physicalStock} - ${productsTable.reservedStock}`,
    productsTable.minimumStock,
  ));
  if (params.stock === "out") conditions.push(sql`${productsTable.physicalStock} - ${productsTable.reservedStock} = 0`);
  const rows = await db
    .select()
    .from(productsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(productsTable.name);
  res.json(ListProductsResponse.parse(rows.map(productDto)));
});

router.post("/products", ...internal, async (req, res) => {
  const input = parseInput(CreateProductBody, req.body, res);
  if (!input) return;
  const actor = actorFrom(res);
  const product = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(productsTable)
      .values({ ...input, sku: input.sku.trim().toUpperCase() })
      .returning();
    if (created.physicalStock > 0) {
      await tx.insert(stockMovementsTable).values({
        productId: created.id,
        type: "received",
        quantity: created.physicalStock,
        note: "Opening balance",
        createdBy: actor.clerkUserId,
      });
    }
    return created;
  });
  res.status(201).json(UpdateProductResponse.parse(productDto(product)));
});

router.patch("/products/:id", ...internal, async (req, res) => {
  const params = parseInput(UpdateProductParams, req.params, res);
  const input = parseInput(UpdateProductBody, req.body, res);
  if (!params || !input) return;
  const [product] = await db
    .update(productsTable)
    .set({ ...input, sku: input.sku?.trim().toUpperCase(), updatedAt: new Date() })
    .where(eq(productsTable.id, params.id))
    .returning();
  if (!product) throw new ApiError(404, "Product not found.");
  res.json(UpdateProductResponse.parse(productDto(product)));
});

router.get("/stock-movements", ...internal, async (_req, res) => {
  const rows = await db
    .select({ movement: stockMovementsTable, productName: productsTable.name })
    .from(stockMovementsTable)
    .innerJoin(productsTable, eq(stockMovementsTable.productId, productsTable.id))
    .orderBy(desc(stockMovementsTable.createdAt))
    .limit(100);
  res.json(ListStockMovementsResponse.parse(rows.map(({ movement, productName }) => movementDto(movement, productName))));
});

router.post("/stock-movements", ...internal, async (req, res) => {
  const input = parseInput(CreateStockMovementBody, req.body, res);
  if (!input) return;
  const actor = actorFrom(res);
  const result = await db.transaction(async (tx) => {
    const [product] = await tx
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, input.productId))
      .for("update")
      .limit(1);
    if (!product) throw new ApiError(404, "Product not found.");
    if (!product.isActive) throw new ApiError(409, "This product is inactive.");
    if (input.type !== "adjustment" && input.quantity <= 0) {
      throw new ApiError(400, "Enter a positive quantity for this movement.");
    }
    const delta = input.type === "sold" || input.type === "damaged"
      ? -input.quantity
      : input.quantity;
    const nextPhysical = product.physicalStock + delta;
    if (nextPhysical < product.reservedStock) {
      throw new ApiError(409, "This movement would reduce stock below already reserved orders.");
    }
    const [updatedProduct] = await tx
      .update(productsTable)
      .set({ physicalStock: nextPhysical, updatedAt: new Date() })
      .where(eq(productsTable.id, product.id))
      .returning();
    const [movement] = await tx
      .insert(stockMovementsTable)
      .values({
        productId: product.id,
        type: input.type,
        quantity: delta,
        note: input.note?.trim() || null,
        createdBy: actor.clerkUserId,
      })
      .returning();
    return { movement, product: updatedProduct };
  });
  res.status(201).json(ListStockMovementsResponse.element.parse(movementDto(result.movement, result.product.name)));
});

export default router;
