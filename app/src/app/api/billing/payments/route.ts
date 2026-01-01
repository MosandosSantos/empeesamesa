import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import {
  CreatePaymentSchema,
  createBillingError,
  getBeneficiaryFromType,
} from "@/lib/validations/billing";
import {
  checkDuplicatePayment,
  updateKpiSnapshot,
} from "@/lib/billing-helpers";
import { Decimal } from "@prisma/client";

/**
 * POST /api/billing/payments
 * Create a new payment and update related charge
 *
 * Body:
 * - memberId: string (UUID)
 * - type: "MONTHLY" | "ANNUAL"
 * - year: number
 * - month: number (required for MONTHLY, must be omitted for ANNUAL)
 * - amount: number
 * - method: "PIX" | "TRANSFERENCIA" | "DINHEIRO" | "BOLETO"
 * - paidAt: string (ISO datetime)
 * - reference: string (optional)
 * - notes: string (optional)
 *
 * Returns:
 * - payment: created payment object
 * - charge: updated charge object
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = CreatePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createBillingError(
          "VALIDATION_ERROR",
          "Dados de pagamento inválidos",
          validation.error.issues
        ),
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if member exists and belongs to the same tenant/loja
    const member = await prisma.member.findFirst({
      where: {
        id: data.memberId,
        tenantId: payload!.tenantId,
        lojaId,
      },
    });

    if (!member) {
      return NextResponse.json(
        createBillingError(
          "MEMBER_NOT_FOUND",
          "Membro não encontrado ou não pertence a esta loja"
        ),
        { status: 404 }
      );
    }

    // Check for duplicate payment
    const isDuplicate = await checkDuplicatePayment(
      payload!.tenantId,
      lojaId,
      data.memberId,
      data.type,
      data.year,
      data.month
    );

    if (isDuplicate) {
      return NextResponse.json(
        createBillingError(
          "DUPLICATE_PAYMENT",
          "Já existe um pagamento confirmado para este período"
        ),
        { status: 409 }
      );
    }

    // Auto-set beneficiary based on type
    const beneficiary = getBeneficiaryFromType(data.type);

    // Convert paidAt to Date if it's a string
    const paidAt =
      typeof data.paidAt === "string" ? new Date(data.paidAt) : data.paidAt;

    // Use transaction to create payment and update charge atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          tenantId: payload!.tenantId,
          lojaId,
          memberId: data.memberId,
          type: data.type,
          year: data.year,
          month: data.month ?? null,
          amount: new Decimal(data.amount),
          method: data.method,
          status: "CONFIRMED",
          paidAt,
          beneficiary,
          createdByUserId: payload!.userId,
          reference: data.reference,
          notes: data.notes,
        },
      });

      // Find or create charge for this period
      const chargeWhere = {
        tenantId_lojaId_type_year_month_memberId: {
          tenantId: payload!.tenantId,
          lojaId,
          type: data.type,
          year: data.year,
          month: data.month ?? null,
          memberId: data.memberId,
        },
      };

      let charge = await tx.duesCharge.findUnique({
        where: chargeWhere,
      });

      if (!charge) {
        // Create charge if it doesn't exist
        charge = await tx.duesCharge.create({
          data: {
            tenantId: payload!.tenantId,
            lojaId,
            memberId: data.memberId,
            type: data.type,
            year: data.year,
            month: data.month ?? null,
            expectedAmount: new Decimal(data.amount),
            status: "PAID",
            paidPaymentId: payment.id,
          },
        });
      } else {
        // Update existing charge
        charge = await tx.duesCharge.update({
          where: chargeWhere,
          data: {
            status: "PAID",
            paidPaymentId: payment.id,
          },
        });
      }

      return { payment, charge };
    });

    // Update KPI snapshot (outside transaction for better performance)
    // This is eventually consistent and doesn't need to be atomic
    await updateKpiSnapshot(
      payload!.tenantId,
      lojaId,
      data.type,
      data.year,
      data.month
    ).catch((err) => {
      console.error("Error updating KPI snapshot:", err);
      // Don't fail the request if KPI update fails
    });

    return NextResponse.json(
      {
        payment: {
          ...result.payment,
          amount: Number(result.payment.amount),
        },
        charge: {
          ...result.charge,
          expectedAmount: Number(result.charge.expectedAmount),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/billing/payments error:", error);
    return NextResponse.json(
      createBillingError("INTERNAL_ERROR", "Erro ao criar pagamento"),
      { status: 500 }
    );
  }
}
