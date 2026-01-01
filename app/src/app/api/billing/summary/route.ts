import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import {
  BillingSummaryQuerySchema,
  createBillingError,
} from "@/lib/validations/billing";
import { getBillingSummary } from "@/lib/billing-helpers";

/**
 * GET /api/billing/summary
 * Get billing summary (KPIs) for a specific year and type
 *
 * Query params:
 * - year: number (2000-2100)
 * - type: "MONTHLY" | "ANNUAL"
 *
 * Returns:
 * - expectedAmount: total expected amount
 * - paidAmount: total paid amount
 * - openAmount: total open amount (expected - paid)
 * - membersActive: count of active members
 * - paidMembers: count of members who have paid
 * - delinquentMembers: count of members who haven't paid
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    // Extract lojaId from authenticated user's tenant
    // Get the first loja for this tenant (in production, this should be from user context)
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
      year: searchParams.get("year"),
      type: searchParams.get("type"),
    };

    const validation = BillingSummaryQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        createBillingError(
          "VALIDATION_ERROR",
          "Parâmetros inválidos",
          validation.error.issues
        ),
        { status: 400 }
      );
    }

    const { year, type } = validation.data;

    // Get billing summary
    const summary = await getBillingSummary(
      payload!.tenantId,
      lojaId,
      type,
      year
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/billing/summary error:", error);
    return NextResponse.json(
      createBillingError(
        "INTERNAL_ERROR",
        "Erro ao buscar resumo de cobrança"
      ),
      { status: 500 }
    );
  }
}
