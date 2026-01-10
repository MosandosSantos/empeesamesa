import { NextRequest, NextResponse } from "next/server";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { canAccessFinance, isLojaAdmin, isTesouraria } from "@/lib/roles";

export async function POST(req: NextRequest) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  const user = await getUserFromPayload(payload!);
  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  if (!canAccessFinance(user.role)) {
    return NextResponse.json({ error: "Voce nao tem permissao para registrar pagamentos" }, { status: 403 });
  }

  const needsLojaRestriction = isLojaAdmin(user.role) || isTesouraria(user.role);
  if (needsLojaRestriction && !user.lojaId) {
    return NextResponse.json({ error: "Usuario sem loja vinculada" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { memberId, year, month, valor, metodoPagamento, tipo } = body;

    // Validacoes
    if (!memberId || !year || !valor || valor <= 0) {
      return NextResponse.json(
        { error: "Campos obrigatorios: memberId, year, valor" },
        { status: 400 }
      );
    }

    // Verificar se o membro existe e pertence ao tenant
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId: payload!.tenantId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membro nao encontrado" },
        { status: 404 }
      );
    }

    if (needsLojaRestriction) {
      const memberLoja = await prisma.member.findFirst({
        where: { id: memberId, tenantId: payload!.tenantId },
        select: { lojaId: true },
      });

      if (!memberLoja || memberLoja.lojaId != user.lojaId) {
        return NextResponse.json({ error: "Voce nao tem permissao para este membro" }, { status: 403 });
      }
    }

    // Determinar o tipo de pagamento
    const paymentType = tipo === "MONTHLY" ? "MENSALIDADE_LOJA" : "ANUIDADE_PRIORADO";

    // Descricao do pagamento
    const description = month
      ? `${paymentType} - ${String(month).padStart(2, '0')}/${year}`
      : `${paymentType} - ${year}`;

    // Buscar categoria de receita (mensalidade ou anuidade)
    let categoria = await prisma.categoria.findFirst({
      where: {
        tenantId: payload!.tenantId,
        nome: {
          contains: tipo === "MONTHLY" ? "Mensalidade" : "Anuidade",
        },
        tipo: "RECEITA",
      },
    });

    // Se ainda nao encontrar, criar uma categoria padrao
    if (!categoria) {
      categoria = await prisma.categoria.create({
        data: {
          tenantId: payload!.tenantId,
          nome: tipo === "MONTHLY" ? "Mensalidades" : "Anuidades",
          tipo: "RECEITA",
        },
      });
    }

    // Verificar se ja existe um pagamento para este membro/periodo
    const existingPayment = await prisma.memberPayment.findFirst({
      where: {
        memberId,
        paymentType,
        referenceYear: parseInt(year),
        referenceMonth: month ? parseInt(month) : null,
        tenantId: payload!.tenantId,
      },
    });

    let payment;
    if (existingPayment) {
      // Atualizar lancamento existente
      await prisma.lancamento.update({
        where: { id: existingPayment.lancamentoId },
        data: {
          valorPrevisto: parseFloat(valor),
          valorPago: parseFloat(valor),
          dataPagamento: new Date(),
          formaPagamento: metodoPagamento || "PIX",
          status: "PAGO",
        },
      });

      // Atualizar pagamento existente
      payment = await prisma.memberPayment.update({
        where: { id: existingPayment.id },
        data: {
          amount: parseFloat(valor),
          paymentDate: new Date(),
          paymentMethod: metodoPagamento || "PIX",
        },
      });
    } else {
      // Criar lancamento financeiro
      const lancamento = await prisma.lancamento.create({
        data: {
          tenantId: payload!.tenantId,
          tipo: "RECEITA",
          categoriaId: categoria.id,
          descricao: description,
          valorPrevisto: parseFloat(valor),
          valorPago: parseFloat(valor),
          dataVencimento: new Date(),
          dataPagamento: new Date(),
          status: "PAGO",
          formaPagamento: metodoPagamento || "PIX",
        },
      });

      // Criar novo pagamento
      payment = await prisma.memberPayment.create({
        data: {
          tenantId: payload!.tenantId,
          memberId,
          lancamentoId: lancamento.id,
          paymentType,
          referenceMonth: month ? parseInt(month) : null,
          referenceYear: parseInt(year),
          description,
          amount: parseFloat(valor),
          paymentDate: new Date(),
          paymentMethod: metodoPagamento || "PIX",
          createdById: user.id,
          createdByName: user.name || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Pagamento registrado com sucesso",
      payment,
    });
  } catch (error) {
    console.error("Error registering payment:", error);
    return NextResponse.json(
      { error: "Erro ao registrar pagamento" },
      { status: 500 }
    );
  }
}
