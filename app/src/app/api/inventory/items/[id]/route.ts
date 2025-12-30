import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import { validateInventoryItem, InventoryItemInput } from "@/lib/validations/inventory";

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  return Number(value);
};

const normalizeItem = (item: Prisma.InventoryItemGetPayload<{}>) => {
  const avgCost = toNumber(item.avgCost) ?? 0;
  const qtyOnHand = item.qtyOnHand ?? 0;
  return {
    ...item,
    avgCost,
    lastPurchaseCost: toNumber(item.lastPurchaseCost),
    totalValue: Number((qtyOnHand * avgCost).toFixed(2)),
  };
};

const normalizeMovement = (movement: Prisma.InventoryMovementGetPayload<{}>) => ({
  ...movement,
  unitCost: toNumber(movement.unitCost),
  movementValue: toNumber(movement.movementValue),
  avgCostBefore: toNumber(movement.avgCostBefore) ?? 0,
  avgCostAfter: toNumber(movement.avgCostAfter) ?? 0,
});

/**
 * GET /api/inventory/items/:id
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    const { id } = await params;
    const itemId = id;

    if (!itemId) {
      return NextResponse.json({ error: "Item nao encontrado" }, { status: 404 });
    }

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId: user.tenantId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item nao encontrado" }, { status: 404 });
    }

    const movements = await prisma.inventoryMovement.findMany({
      where: { itemId: item.id, tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      item: normalizeItem(item),
      movements: movements.map(normalizeMovement),
    });
  } catch (err) {
    console.error("GET /api/inventory/items/:id error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar item" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory/items/:id
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    if (user.role === "MEMBER") {
      return NextResponse.json({ error: "Permissao negada" }, { status: 403 });
    }

    const { id } = await params;
    const itemId = id;

    if (!itemId) {
      return NextResponse.json({ error: "Item nao encontrado" }, { status: 404 });
    }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item nao encontrado" }, { status: 404 });
    }

    if (existing.archivedAt) {
      return NextResponse.json({ error: "Item arquivado nao pode ser editado" }, { status: 400 });
    }

    const body: InventoryItemInput = await request.json();
    const validationErrors = validateInventoryItem(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Dados invalidos", errors: validationErrors }, { status: 400 });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        sku: body.sku?.trim() || null,
        name: body.name.trim(),
        unit: body.unit || null,
        category: body.category || null,
        location: body.location || null,
        minQty: body.minQty ?? 0,
        reorderPoint: body.reorderPoint ?? 0,
        assignedToMemberId: body.assignedToMemberId || null,
        notes: body.notes || null,
        updatedById: user.id,
        updatedByName: user.email,
      },
    });

    return NextResponse.json({ item: normalizeItem(updated) });
  } catch (err) {
    console.error("PUT /api/inventory/items/:id error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar item" },
      { status: 500 }
    );
  }
}
