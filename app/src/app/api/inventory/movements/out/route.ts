import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import { InventoryMovementType } from "@/types/inventario";
import { validateInventoryMovement, InventoryMovementInput } from "@/lib/validations/inventory";

export async function POST(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    const body = (await request.json()) as InventoryMovementInput & { itemId?: string };
    const validationErrors = validateInventoryMovement({
      type: InventoryMovementType.OUT,
      qty: body.qty,
      unitCost: body.unitCost,
      reason: body.reason,
      happenedAt: body.happenedAt,
    });

    if (!body.itemId) {
      validationErrors.push({ field: "itemId", message: "Item obrigatorio" });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Dados invalidos", errors: validationErrors }, { status: 400 });
    }

    const item = await prisma.inventoryItem.findFirst({
      where: { id: body.itemId, tenantId: user.tenantId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item nao encontrado" }, { status: 404 });
    }

    if (item.archivedAt) {
      return NextResponse.json({ error: "Item arquivado nao permite saida" }, { status: 400 });
    }

    const qty = Number(body.qty);
    if (item.qtyOnHand < qty) {
      return NextResponse.json({ error: "Estoque insuficiente" }, { status: 400 });
    }

    const currentQty = item.qtyOnHand;
    const currentAvg = Number(item.avgCost);
    const newQty = currentQty - qty;
    const movementValue = qty * currentAvg;

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          qtyOnHand: newQty,
          updatedById: user.id,
          updatedByName: user.email,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId: user.tenantId,
          itemId: item.id,
          type: InventoryMovementType.OUT,
          qty,
          unitCost: null,
          movementValue,
          qtyBefore: currentQty,
          qtyAfter: newQty,
          avgCostBefore: currentAvg,
          avgCostAfter: currentAvg,
          reason: body.reason?.trim() || null,
          createdById: user.id,
          createdByName: user.email,
          ip,
          userAgent,
        },
      });

      return updatedItem;
    });

    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error("POST /api/inventory/movements/out error:", err);
    return NextResponse.json({ error: "Erro ao registrar saida" }, { status: 500 });
  }
}
