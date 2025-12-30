import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

type CsvValue = string | number | boolean | null | undefined;

function toCsv(rows: Record<string, CsvValue>[], columns: string[]) {
  const header = columns.join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return "";
        const asString = String(value).replace(/"/g, '""');
        return `"${asString}"`;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    const isMember = user.role === "MEMBER";
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "items";
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const itemId = searchParams.get("itemId");
    const movementType = searchParams.get("movementType");
    const author = searchParams.get("author");
    const reason = searchParams.get("reason");

    let csvContent = "";
    let filename = "inventario.csv";

    if (type === "movements" || type === "logs") {
      const movementWhere: any = {
        tenantId: user.tenantId,
        ...(isMember ? { item: { assignedToMemberId: user.id } } : {}),
      };

      if (itemId) {
        movementWhere.itemId = itemId;
      }

      if (movementType) {
        movementWhere.type = movementType;
      }

      if (startDate || endDate) {
        movementWhere.createdAt = {};
        if (startDate) movementWhere.createdAt.gte = new Date(startDate);
        if (endDate) movementWhere.createdAt.lte = new Date(endDate);
      }
      if (author) {
        movementWhere.OR = [
          { createdByName: { contains: author, mode: "insensitive" } },
          { createdById: { contains: author, mode: "insensitive" } },
        ];
      }
      if (reason) {
        movementWhere.reason = { contains: reason, mode: "insensitive" };
      }

      const movements = await prisma.inventoryMovement.findMany({
        where: movementWhere,
        include: {
          item: {
            select: { name: true, sku: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (format === "pdf") {
        const tenant = await prisma.tenant.findUnique({
          where: { id: user.tenantId },
          select: { name: true },
        });
        const itemLabel = itemId
          ? movements[0]?.item?.name ?? "Item selecionado"
          : null;

        const pdfBuffer = await buildMovementsPdf({
          movements,
          startDate,
          endDate,
          movementType,
          itemLabel,
          tenantName: tenant?.name ?? "Inventario",
          generatedBy: user.email ?? user.id,
        });

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=\"inventario_movements.pdf\"",
          },
        });
      }

      const rows = movements.map((movement) => ({
        item: movement.item?.name ?? "",
        sku: movement.item?.sku ?? "",
        type: movement.type,
        qty: movement.qty,
        unitCost: movement.unitCost ?? "",
        movementValue: movement.movementValue ?? "",
        qtyBefore: movement.qtyBefore,
        qtyAfter: movement.qtyAfter,
        avgCostBefore: movement.avgCostBefore,
        avgCostAfter: movement.avgCostAfter,
        createdAt: movement.createdAt.toISOString(),
        createdBy: movement.createdByName ?? movement.createdById ?? "",
        reason: movement.reason ?? "",
      }));

      csvContent = toCsv(rows, [
        "item",
        "sku",
        "type",
        "qty",
        "unitCost",
        "movementValue",
        "qtyBefore",
        "qtyAfter",
        "avgCostBefore",
        "avgCostAfter",
        "createdAt",
        "createdBy",
        "reason",
      ]);
      filename = "inventario_movements.csv";
    } else {
      const items = await prisma.inventoryItem.findMany({
        where: {
          tenantId: user.tenantId,
          ...(isMember ? { assignedToMemberId: user.id } : {}),
        },
        orderBy: { name: "asc" },
      });

      const rows = items.map((item) => ({
        sku: item.sku ?? "",
        name: item.name,
        unit: item.unit ?? "",
        category: item.category ?? "",
        location: item.location ?? "",
        minQty: item.minQty,
        reorderPoint: item.reorderPoint,
        qtyOnHand: item.qtyOnHand,
        avgCost: item.avgCost,
        totalValue: Number(item.qtyOnHand) * Number(item.avgCost),
        status: item.archivedAt ? "arquivado" : "ativo",
        updatedAt: item.updatedAt.toISOString(),
      }));

      csvContent = toCsv(rows, [
        "sku",
        "name",
        "unit",
        "category",
        "location",
        "minQty",
        "reorderPoint",
        "qtyOnHand",
        "avgCost",
        "totalValue",
        "status",
        "updatedAt",
      ]);
      filename = "inventario_itens.csv";
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("GET /api/inventory/export error:", err);
    return NextResponse.json({ error: "Erro ao exportar inventario" }, { status: 500 });
  }
}

type MovementForPdf = {
  item: { name: string | null; sku: string | null } | null;
  type: string;
  qty: number;
  movementValue: any;
  createdAt: Date;
  createdByName: string | null;
  createdById: string | null;
  reason: string | null;
};

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatMovementType(value: string | null) {
  if (!value) return "";
  if (value === "IN") return "Entrada";
  if (value === "OUT") return "Saida";
  if (value === "ADJUST") return "Ajuste";
  return value;
}

async function buildMovementsPdf({
  movements,
  startDate,
  endDate,
  movementType,
  itemLabel,
  tenantName,
  generatedBy,
}: {
  movements: MovementForPdf[];
  startDate: string | null;
  endDate: string | null;
  movementType: string | null;
  itemLabel: string | null;
  tenantName: string;
  generatedBy: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 40;
  const footerHeight = 30;

  const periodLabel = startDate || endDate
    ? `${startDate ? formatDate(new Date(startDate)) : "..."} ate ${endDate ? formatDate(new Date(endDate)) : "..."}`
    : "Todos os registros";

  const summary = movements.reduce(
    (acc, movement) => {
      const value = movement.movementValue ? Number(movement.movementValue) : 0;
      if (movement.type === "IN") {
        acc.inQty += movement.qty;
        acc.inValue += value;
      } else if (movement.type === "OUT") {
        acc.outQty += movement.qty;
        acc.outValue += value;
      }
      return acc;
    },
    { inQty: 0, outQty: 0, inValue: 0, outValue: 0 }
  );
  const netValue = summary.inValue - summary.outValue;

  const columns = [
    { key: "createdAt", label: "Data", width: 60, align: "left" as const },
    { key: "item", label: "Item", width: 150, align: "left" as const },
    { key: "type", label: "Tipo", width: 50, align: "left" as const },
    { key: "qty", label: "Qtd", width: 40, align: "right" as const },
    { key: "movementValue", label: "Valor", width: 65, align: "right" as const },
    { key: "createdBy", label: "Usuario", width: 80, align: "left" as const },
    { key: "reason", label: "Motivo", width: 120, align: "left" as const },
  ];

  const pageWidth = pageSize[0] - margin * 2;
  const totalWidth = columns.reduce((acc, col) => acc + col.width, 0);
  if (totalWidth > pageWidth) {
    const scale = pageWidth / totalWidth;
    columns.forEach((col) => {
      col.width = Math.floor(col.width * scale);
    });
  }

  const logoPath = path.join(process.cwd(), "public", "img", "logo-1.png");
  const logoBytes = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;
  const logoImage = logoBytes ? await pdfDoc.embedPng(logoBytes) : null;

  const footerLabel = `Gerado em ${new Date().toLocaleString("pt-BR")} por ${generatedBy}`;
  const footerColor = rgb(0.42, 0.45, 0.5);

  const drawFooter = (page: any, pageIndex: number, totalPages: number) => {
    const pageNumber = `Pagina ${pageIndex + 1} de ${totalPages}`;
    const pageWidth = page.getWidth();
    const footerY = margin - 12;
    page.drawText(footerLabel, {
      x: margin,
      y: footerY,
      size: 8,
      font,
      color: footerColor,
    });
    const pageNumberWidth = font.widthOfTextAtSize(pageNumber, 8);
    page.drawText(pageNumber, {
      x: pageWidth - margin - pageNumberWidth,
      y: footerY,
      size: 8,
      font,
      color: footerColor,
    });
  };

  const drawHeader = (page: any) => {
    const height = page.getHeight();
    const topY = height - margin;

    let headerOffset = 0;
    if (logoImage) {
      const logoWidth = 90;
      const scale = logoWidth / logoImage.width;
      const logoHeight = logoImage.height * scale;
      page.drawImage(logoImage, {
        x: margin,
        y: topY - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      headerOffset = Math.max(headerOffset, logoHeight);
    }

    page.drawText(tenantName, {
      x: page.getWidth() - margin - 200,
      y: topY - 10,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: 200,
    });

    let cursorY = topY - Math.max(60, headerOffset + 20);
    page.drawText("Relatorio de Movimentacoes", {
      x: margin,
      y: cursorY,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    cursorY -= 16;
    page.drawText(`Periodo: ${periodLabel}`, {
      x: margin,
      y: cursorY,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    if (movementType || itemLabel) {
      const filters = [
        movementType ? `Tipo: ${formatMovementType(movementType)}` : null,
        itemLabel ? `Item: ${itemLabel}` : null,
      ].filter(Boolean).join(" | ");
      cursorY -= 12;
      page.drawText(`Filtro: ${filters}`, {
        x: margin,
        y: cursorY,
        size: 9,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
    }

    cursorY -= 16;
    page.drawText(
      `Entradas: ${summary.inQty} | Saidas: ${summary.outQty} | Valor liquido: ${formatCurrency(netValue)}`,
      {
        x: margin,
        y: cursorY,
        size: 9,
        font,
        color: rgb(0.12, 0.16, 0.23),
      },
    );

    cursorY -= 18;

    let headerX = margin;
    columns.forEach((col) => {
      page.drawText(col.label, {
        x: headerX,
        y: cursorY,
        size: 9,
        font: fontBold,
        color: rgb(0.19, 0.19, 0.19),
      });
      headerX += col.width;
    });

    page.drawLine({
      start: { x: margin, y: cursorY - 6 },
      end: { x: page.getWidth() - margin, y: cursorY - 6 },
      thickness: 1,
      color: rgb(0.82, 0.84, 0.86),
    });

    return cursorY - 14;
  };

  const truncateText = (text: string, width: number, size: number) => {
    if (font.widthOfTextAtSize(text, size) <= width) return text;
    let current = text;
    while (current.length > 1 && font.widthOfTextAtSize(`${current}...`, size) > width) {
      current = current.slice(0, -1);
    }
    return `${current}...`;
  };

  const drawRow = (page: any, y: number, row: Record<string, string | number>) => {
    let x = margin;
    columns.forEach((col) => {
      const raw = row[col.key as keyof typeof row] ?? "";
      const text = truncateText(String(raw), col.width - 4, 8);
      let drawX = x;
      if (col.align === "right") {
        const width = font.widthOfTextAtSize(text, 8);
        drawX = x + col.width - width;
      }
      page.drawText(text, {
        x: drawX,
        y,
        size: 8,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      x += col.width;
    });
  };

  let page = pdfDoc.addPage(pageSize);
  let cursorY = drawHeader(page);

  const rowHeight = 14;
  for (const movement of movements) {
    const row = {
      createdAt: formatDate(movement.createdAt),
      item: movement.item?.name ?? "-",
      type: formatMovementType(movement.type),
      qty: movement.qty,
      movementValue: movement.movementValue ? formatCurrency(Number(movement.movementValue)) : "-",
      createdBy: movement.createdByName ?? movement.createdById ?? "-",
      reason: movement.reason ?? "-",
    };

    if (cursorY - rowHeight < margin + footerHeight) {
      page = pdfDoc.addPage(pageSize);
      cursorY = drawHeader(page);
    }

    drawRow(page, cursorY, row);
    cursorY -= rowHeight;
  }

  const totalPages = pdfDoc.getPages().length;
  pdfDoc.getPages().forEach((pg, index) => drawFooter(pg, index, totalPages));
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
