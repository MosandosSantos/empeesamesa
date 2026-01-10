import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, getUserFromPayload } from "@/lib/api-auth";
import { markPayment } from "@/lib/payments/services";
import { markPaymentSchema } from "@/lib/validations/payments";
import { prisma } from "@/lib/prisma";
import { canAccessFinance, isLojaAdmin, isTesouraria } from "@/lib/roles";

/**
 * POST /api/payments/mark
 *
 * Marca ou atualiza o status de um pagamento
 *
 * Body:
 * {
 *   "memberId": "uuid",
 *   "periodId": "uuid",
 *   "status": "PAID" | "PENDING" | "CANCELED",
 *   "amount": 95.00,
 *   "method": "PIX" | "DINHEIRO" | "TRANSFERENCIA" | "BOLETO" | "CARTAO" | "CONVENIO",
 *   "paidAt": "2025-12-19T12:00:00.000Z",
 *   "notes": "..."
 * }
 *
 * Permissões:
 * - SYS_ADMIN: pode marcar qualquer pagamento
 * - LODGE_ADMIN: pode marcar pagamentos da sua loja
 * - MEMBER: NÃO pode marcar pagamentos (403)
 */
export async function POST(request: NextRequest) {
  const { payload, error } = await verifyAuth(request);
  if (error) return error;

  const user = await getUserFromPayload(payload!);
  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  // Membros não podem marcar pagamentos
  if (user.role === "MEMBER") {
    return NextResponse.json(
      { error: "Você não tem permissão para marcar pagamentos" },
      { status: 403 }
    );
  }

  // Parse do body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido" },
      { status: 400 }
    );
  }

  // Validar body com Zod
  const validation = markPaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: validation.error.issues },
      { status: 400 }
    );
  }

  const input = validation.data;

  // Verificar se o período e o membro pertencem ao tenant correto
  const period = await prisma.paymentPeriod.findUnique({
    where: { id: input.periodId },
    select: { tenantId: true, lojaId: true },
  });

  if (!period) {
    return NextResponse.json(
      { error: "Período não encontrado" },
      { status: 404 }
    );
  }

  const member = await prisma.member.findUnique({
    where: { id: input.memberId },
    select: { tenantId: true, lojaId: true },
  });

  if (!member) {
    return NextResponse.json(
      { error: "Membro não encontrado" },
      { status: 404 }
    );
  }

  // Verificar permissão de tenant
  const effectiveTenantId = user.tenantId;

  if (user.role !== "SYS_ADMIN") {
    // LODGE_ADMIN só pode marcar pagamentos do próprio tenant
    if (period.tenantId !== effectiveTenantId || member.tenantId !== effectiveTenantId) {
      return NextResponse.json(
        { error: "Você não tem permissão para marcar este pagamento" },
        { status: 403 }
      );
    }
  }

  // Usar o tenantId do período
  const tenantId = period.tenantId;

  try {
    await markPayment(tenantId, input, user.id);

    return NextResponse.json({
      success: true,
      message: "Pagamento marcado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao marcar pagamento:", err);
    return NextResponse.json(
      { error: "Erro ao marcar pagamento" },
      { status: 500 }
    );
  }
}
