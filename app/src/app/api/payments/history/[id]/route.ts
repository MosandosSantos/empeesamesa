import { NextRequest, NextResponse } from "next/server";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { canAccessFinance, isLojaAdmin, isTesouraria } from "@/lib/roles";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  const user = await getUserFromPayload(payload!);
  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  if (!canAccessFinance(user.role) && user.role !== "MEMBER") {
    return NextResponse.json({ error: "Voce nao tem permissao para acessar pagamentos" }, { status: 403 });
  }

  const needsLojaRestriction = isLojaAdmin(user.role) || isTesouraria(user.role);
  if (needsLojaRestriction && !user.lojaId) {
    return NextResponse.json({ error: "Usuario sem loja vinculada" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Verificar se o membro existe e pertence ao tenant
    const member = await prisma.member.findFirst({
      where: {
        id,
        tenantId: payload!.tenantId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    if (user.role === "MEMBER") {
      const memberSelf = await prisma.member.findFirst({
        where: { tenantId: payload!.tenantId, email: user.email },
        select: { id: true },
      });

      if (!memberSelf || memberSelf.id != id) {
        return NextResponse.json({ error: "Voce nao tem permissao para acessar este membro" }, { status: 403 });
      }
    }

    if (needsLojaRestriction) {
      const memberLoja = await prisma.member.findFirst({
        where: { id, tenantId: payload!.tenantId },
        select: { lojaId: true },
      });

      if (!memberLoja || memberLoja.lojaId != user.lojaId) {
        return NextResponse.json({ error: "Voce nao tem permissao para acessar este membro" }, { status: 403 });
      }
    }

    // Buscar todos os pagamentos do membro
    const payments = await prisma.memberPayment.findMany({
      where: {
        memberId: id,
        tenantId: payload!.tenantId,
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
