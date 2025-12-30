import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verificar se o membro existe e pertence ao tenant
    const member = await prisma.member.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    // Buscar todos os pagamentos do membro
    const payments = await prisma.memberPayment.findMany({
      where: {
        memberId: id,
        tenantId: auth.tenantId,
        amount: {
          gt: 0, // Apenas pagamentos com valor > 0
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    // Formatar os dados para retorno
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      valor: payment.amount,
      dataPagamento: payment.paymentDate.toISOString(),
      metodoPagamento: payment.paymentMethod || "PIX",
      observacoes: payment.description || null,
      tipo: payment.paymentType,
      periodo: {
        year: payment.referenceYear || 0,
        month: payment.referenceMonth || null,
        label: payment.referenceMonth
          ? `${String(payment.referenceMonth).padStart(2, '0')}/${payment.referenceYear}`
          : String(payment.referenceYear),
      },
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("Error loading payment history:", error);
    return NextResponse.json(
      { error: "Erro ao carregar histórico de pagamentos" },
      { status: 500 }
    );
  }
}
