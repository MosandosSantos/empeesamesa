import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import {
  DuesMatrixQuerySchema,
  createBillingError,
} from "@/lib/validations/billing";
import { decimalToNumber } from "@/lib/billing-helpers";

/**
 * GET /api/billing/dues/matrix
 * Get a paginated matrix of members × payment periods
 *
 * Query params:
 * - year: number (2000-2100)
 * - type: "MONTHLY" | "ANNUAL"
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - search: string (optional member name filter)
 *
 * Returns:
 * - members: array of member payment data
 * - pagination: pagination metadata
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
      year: searchParams.get("year"),
      type: searchParams.get("type"),
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
      search: searchParams.get("search") || undefined,
    };

    const validation = DuesMatrixQuerySchema.safeParse(queryParams);
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

    const { year, type, page = 1, limit = 50, search } = validation.data;

    // Build member filter
    const memberWhere: any = {
      tenantId: payload!.tenantId,
      lojaId,
      situacao: "ATIVO",
    };

    if (search) {
      memberWhere.nomeCompleto = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Get total count for pagination
    const totalMembers = await prisma.member.count({
      where: memberWhere,
    });

    // Get paginated members
    const members = await prisma.member.findMany({
      where: memberWhere,
      select: {
        id: true,
        nomeCompleto: true,
      },
      orderBy: {
        nomeCompleto: "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get all charges for these members in the specified period
    const memberIds = members.map((m) => m.id);

    const chargesWhere: any = {
      tenantId: payload!.tenantId,
      lojaId,
      type,
      year,
      memberId: {
        in: memberIds,
      },
    };

    const charges = await prisma.duesCharge.findMany({
      where: chargesWhere,
      include: {
        paidPayment: {
          select: {
            id: true,
            amount: true,
            method: true,
            paidAt: true,
            status: true,
          },
        },
      },
    });

    // Build matrix data
    const matrixData = members.map((member) => {
      const memberCharges = charges.filter((c) => c.memberId === member.id);

      const payments: Record<string, any> = {};

      if (type === "MONTHLY") {
        // For monthly, create entries for each month
        for (let month = 1; month <= 12; month++) {
          const charge = memberCharges.find((c) => c.month === month);

          if (charge) {
            payments[month.toString()] = {
              chargeId: charge.id,
              expectedAmount: decimalToNumber(charge.expectedAmount),
              status: charge.status,
              payment: charge.paidPayment
                ? {
                    id: charge.paidPayment.id,
                    amount: decimalToNumber(charge.paidPayment.amount),
                    method: charge.paidPayment.method,
                    paidAt: charge.paidPayment.paidAt,
                    status: charge.paidPayment.status,
                  }
                : null,
            };
          } else {
            payments[month.toString()] = {
              chargeId: null,
              expectedAmount: 0,
              status: "NOT_GENERATED",
              payment: null,
            };
          }
        }
      } else {
        // For annual, single entry for the year
        const charge = memberCharges.find((c) => c.year === year);

        payments[year.toString()] = charge
          ? {
              chargeId: charge.id,
              expectedAmount: decimalToNumber(charge.expectedAmount),
              status: charge.status,
              payment: charge.paidPayment
                ? {
                    id: charge.paidPayment.id,
                    amount: decimalToNumber(charge.paidPayment.amount),
                    method: charge.paidPayment.method,
                    paidAt: charge.paidPayment.paidAt,
                    status: charge.paidPayment.status,
                  }
                : null,
            }
          : {
              chargeId: null,
              expectedAmount: 0,
              status: "NOT_GENERATED",
              payment: null,
            };
      }

      return {
        memberId: member.id,
        memberName: member.nomeCompleto,
        payments,
      };
    });

    const totalPages = Math.ceil(totalMembers / limit);

    return NextResponse.json({
      members: matrixData,
      pagination: {
        page,
        limit,
        total: totalMembers,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/billing/dues/matrix error:", error);
    return NextResponse.json(
      createBillingError(
        "INTERNAL_ERROR",
        "Erro ao buscar matriz de cobranças"
      ),
      { status: 500 }
    );
  }
}
