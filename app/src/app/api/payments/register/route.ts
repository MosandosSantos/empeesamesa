import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { memberId, year, month, valor, metodoPagamento, tipo } = body;

    // Validações
    if (!memberId || !year || !valor || valor <= 0) {
      return NextResponse.json(
        { error: "Campos obrigatórios: memberId, year, valor" },
        { status: 400 }
      );
    }

    // Verificar se o membro existe e pertence ao tenant
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId: auth.tenantId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    // Determinar o tipo de pagamento
    const paymentType = tipo === "MONTHLY" ? "MENSALIDADE_LOJA" : "ANUIDADE_PRIORADO";

    // Descrição do pagamento
    const description = month
      ? `${paymentType} - ${String(month).padStart(2, '0')}/${year}`
      : `${paymentType} - ${year}`;

    // Buscar categoria de receita (mensalidade ou anuidade)
    let categoria = await prisma.categoria.findFirst({
      where: {
        tenantId: auth.tenantId,
        nome: {
          contains: tipo === "MONTHLY" ? "Mensalidade" : "Anuidade",
        },
      },
    });

    // Se não encontrar, buscar qualquer categoria
    if (!categoria) {
      categoria = await prisma.categoria.findFirst({
        where: {
          tenantId: auth.tenantId,
        },
      });
    }

    // Se ainda não encontrar, criar uma categoria padrão
    if (!categoria) {
      categoria = await prisma.categoria.create({
        data: {
          tenantId: auth.tenantId,
          nome: tipo === "MONTHLY" ? "Mensalidades" : "Anuidades",
        },
      });
    }

    // Verificar se já existe um pagamento para este membro/período
    const existingPayment = await prisma.memberPayment.findFirst({
      where: {
        memberId,
        paymentType,
        referenceYear: parseInt(year),
        referenceMonth: month ? parseInt(month) : null,
        tenantId: auth.tenantId,
      },
    });

    let payment;
    if (existingPayment) {
      // Atualizar lançamento existente
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
      // Criar lançamento financeiro
      const lancamento = await prisma.lancamento.create({
        data: {
          tenantId: auth.tenantId,
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
          tenantId: auth.tenantId,
          memberId,
          lancamentoId: lancamento.id,
          paymentType,
          referenceMonth: month ? parseInt(month) : null,
          referenceYear: parseInt(year),
          description,
          amount: parseFloat(valor),
          paymentDate: new Date(),
          paymentMethod: metodoPagamento || "PIX",
          createdById: auth.userId,
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
