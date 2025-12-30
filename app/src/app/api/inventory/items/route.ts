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

/**
 * GET /api/inventory/items
 * Query params: search, assigned (true/false), belowMin (true/false), includeArchived, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const assigned = searchParams.get("assigned");
    const belowMin = searchParams.get("belowMin") === "true";
    const includeArchived = searchParams.get("includeArchived") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const baseWhere: Prisma.InventoryItemWhereInput = {
      tenantId: user.tenantId,
    };

    if (!includeArchived) {
      baseWhere.archivedAt = null;
    }

    if (assigned === "true") {
      baseWhere.NOT = { assignedToMemberId: null };
    } else if (assigned === "false") {
      baseWhere.assignedToMemberId = null;
    }

    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    let items: Prisma.InventoryItemGetPayload<{}>[] = [];
    let total = 0;

    if (belowMin) {
      const rawItems = await prisma.inventoryItem.findMany({
        where: baseWhere,
        orderBy: { updatedAt: "desc" },
      });
      const filtered = rawItems.filter((item) => item.minQty > 0 && item.qtyOnHand <= item.minQty);
      total = filtered.length;
      items = filtered.slice((page - 1) * limit, page * limit);
    } else {
      [items, total] = await Promise.all([
        prisma.inventoryItem.findMany({
          where: baseWhere,
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.inventoryItem.count({ where: baseWhere }),
      ]);
    }

    const belowMinItems = await prisma.inventoryItem.findMany({
      where: baseWhere,
      select: { qtyOnHand: true, minQty: true, avgCost: true },
    });

    const belowMinCount = belowMinItems.filter((item) => item.minQty > 0 && item.qtyOnHand <= item.minQty).length;
    const totalValue = belowMinItems.reduce((acc, item) => {
      const avg = toNumber(item.avgCost) ?? 0;
      return acc + item.qtyOnHand * avg;
    }, 0);

    return NextResponse.json({
      items: items.map(normalizeItem),
      summary: {
        total,
        belowMin: belowMinCount,
        archived: includeArchived
          ? await prisma.inventoryItem.count({ where: { ...baseWhere, archivedAt: { not: null } } })
          : 0,
        totalValue: Number(totalValue.toFixed(2)),
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/inventory/items error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar itens de inventario" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/items
 * Body: InventoryItemInput
 */
export async function POST(request: NextRequest) {
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

    const body: InventoryItemInput = await request.json();
    const validationErrors = validateInventoryItem(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Dados invalidos", errors: validationErrors }, { status: 400 });
    }

    const created = await prisma.inventoryItem.create({
      data: {
        tenantId: user.tenantId,
        sku: body.sku?.trim() || null,
        name: body.name.trim(),
        unit: body.unit || null,
        category: body.category || null,
        location: body.location || null,
        minQty: body.minQty ?? 0,
        reorderPoint: body.reorderPoint ?? 0,
        qtyOnHand: 0,
        avgCost: 0,
        assignedToMemberId: body.assignedToMemberId || null,
        notes: body.notes || null,
        createdById: user.id,
        createdByName: user.email,
        updatedById: user.id,
        updatedByName: user.email,
      },
    });

    return NextResponse.json({ item: normalizeItem(created) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/inventory/items error:", err);
    return NextResponse.json(
      { error: "Erro ao criar item de inventario" },
      { status: 500 }
    );
  }
}
