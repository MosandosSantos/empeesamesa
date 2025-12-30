import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import { InventoryMovementType } from "@/types/inventario";

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  return Number(value);
};

export async function GET(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const author = searchParams.get("author");
    const reason = searchParams.get("reason");

    const where: Prisma.InventoryMovementWhereInput = {
      tenantId: user.tenantId,
    };

    if (itemId) {
      where.itemId = itemId;
    }

    if (type && Object.values(InventoryMovementType).includes(type as InventoryMovementType)) {
      where.type = type as InventoryMovementType;
    }

    if (from || to) {
      where.createdAt = {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      };
    }
    if (author) {
      where.OR = [
        { createdByName: { contains: author, mode: "insensitive" } },
        { createdById: { contains: author, mode: "insensitive" } },
      ];
    }
    if (reason) {
      where.reason = { contains: reason, mode: "insensitive" };
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { item: { select: { name: true, sku: true } } },
      take: 300,
    });

    return NextResponse.json({
      movements: movements.map((movement) => ({
        ...movement,
        unitCost: toNumber(movement.unitCost),
        movementValue: toNumber(movement.movementValue),
        avgCostBefore: toNumber(movement.avgCostBefore) ?? 0,
        avgCostAfter: toNumber(movement.avgCostAfter) ?? 0,
        itemName: movement.item?.name ?? "",
        itemSku: movement.item?.sku ?? null,
      })),
    });
  } catch (err) {
    console.error("GET /api/inventory/movements error:", err);
    return NextResponse.json({ error: "Erro ao buscar movimentacoes" }, { status: 500 });
  }
}
