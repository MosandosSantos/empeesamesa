import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import { verifyPassword } from "@/lib/auth";
import { validateInventoryArchive, InventoryArchiveInput } from "@/lib/validations/inventory";
import { InventoryMovementType } from "@/types/inventario";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Somente admin pode arquivar itens" }, { status: 403 });
    }

    const body: InventoryArchiveInput = await request.json();
    const validationErrors = validateInventoryArchive(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Dados invalidos", errors: validationErrors }, { status: 400 });
    }

    const passwordOk = await verifyPassword(body.password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 403 });
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

    if (item.archivedAt) {
      return NextResponse.json({ error: "Item ja esta arquivado" }, { status: 400 });
    }

    if (item.qtyOnHand > 0) {
      return NextResponse.json({ error: "Item com saldo precisa estar zerado para arquivar" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    const updated = await prisma.$transaction(async (tx) => {
      const archivedItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          archivedAt: new Date(),
          archivedById: user.id,
          archivedByName: user.email,
          archiveReason: body.reason.trim(),
          updatedById: user.id,
          updatedByName: user.email,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId: user.tenantId,
          itemId: item.id,
          type: InventoryMovementType.ARCHIVE,
          qty: 0,
          unitCost: null,
          movementValue: 0,
          qtyBefore: item.qtyOnHand,
          qtyAfter: item.qtyOnHand,
          avgCostBefore: item.avgCost,
          avgCostAfter: item.avgCost,
          reason: body.reason.trim(),
          createdById: user.id,
          createdByName: user.email,
          ip,
          userAgent,
        },
      });

      return archivedItem;
    });

    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error("PATCH /api/inventory/items/:id/archive error:", err);
    return NextResponse.json({ error: "Erro ao arquivar item" }, { status: 500 });
  }
}
