import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import {
  PaymentHistoryQuerySchema,
  createBillingError,
} from "@/lib/validations/billing";
import { decimalToNumber } from "@/lib/billing-helpers";

/**
 * GET /api/billing/payments/history
 * Get payment history with optional filters
 *
 * Query params:
 * - year: number (optional)
 * - month: number (optional, 1-12)
 * - memberId: string (optional, UUID)
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - format: "json" | "csv" (default: "json")
 *
 * Returns:
 * - JSON: { payments: [...], pagination: {...} }
 * - CSV: text/csv stream
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    // Extract lojaId from authenticated user's tenant
    const loja = await prisma.loja.findFirst({
      where: {
        tenantId: payload!.tenantId,
      },
    });

    if (!loja) {
      return NextResponse.json(
        createBillingError(
          "FORBIDDEN",
          "Usuário não tem acesso a nenhuma loja"
        ),
        { status: 403 }
      );
    }

    const lojaId = loja.id;

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      year: searchParams.get("year") || undefined,
      month: searchParams.get("month") || undefined,
      memberId: searchParams.get("memberId") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
      format: searchParams.get("format") || "json",
    };

    const validation = PaymentHistoryQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        createBillingError(
          "VALIDATION_ERROR",
          "Parâmetros inválidos",
          validation.error.errors
        ),
        { status: 400 }
      );
    }

    const { year, month, memberId, page = 1, limit = 50, format = "json" } = validation.data;

    // Build where clause
    const where: any = {
      tenantId: payload!.tenantId,
      lojaId,
    };

    if (year !== undefined) {
      where.year = year;
    }

    if (month !== undefined) {
      where.month = month;
    }

    if (memberId) {
      where.memberId = memberId;
    }

    // Get total count for pagination
    const totalPayments = await prisma.payment.count({ where });

    // Get payments with member info
    const payments = await prisma.payment.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            nomeCompleto: true,
          },
        },
      },
      orderBy: {
        paidAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Handle CSV export
    if (format === "csv") {
      const csvRows = [
        // Header
        [
          "ID",
          "Membro ID",
          "Nome do Membro",
          "Tipo",
          "Ano",
          "Mês",
          "Valor",
          "Método",
          "Status",
          "Data de Pagamento",
          "Beneficiário",
          "Referência",
          "Observações",
          "Criado em",
        ].join(","),
      ];

      // Data rows
      for (const payment of payments) {
        const row = [
          payment.id,
          payment.memberId,
          `"${payment.member.nomeCompleto}"`,
          payment.type,
          payment.year,
          payment.month ?? "",
          decimalToNumber(payment.amount),
          payment.method,
          payment.status,
          payment.paidAt.toISOString(),
          payment.beneficiary,
          payment.reference ? `"${payment.reference}"` : "",
          payment.notes ? `"${payment.notes.replace(/"/g, '""')}"` : "",
          payment.createdAt.toISOString(),
        ].join(",");
        csvRows.push(row);
      }

      const csv = csvRows.join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="payment-history-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON format
    const totalPages = Math.ceil(totalPayments / limit);

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        memberId: p.memberId,
        memberName: p.member.nomeCompleto,
        type: p.type,
        year: p.year,
        month: p.month,
        amount: decimalToNumber(p.amount),
        method: p.method,
        status: p.status,
        paidAt: p.paidAt,
        beneficiary: p.beneficiary,
        reference: p.reference,
        notes: p.notes,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: totalPayments,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/billing/payments/history error:", error);
    return NextResponse.json(
      createBillingError(
        "INTERNAL_ERROR",
        "Erro ao buscar histórico de pagamentos"
      ),
      { status: 500 }
    );
  }
}
