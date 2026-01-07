import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, getUserFromPayload } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

// PUT /api/lojas/[id] - Update lodge
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "SYS_ADMIN") {
      return NextResponse.json({ error: "Somente admin" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if lodge exists
    const existingLoja = await prisma.loja.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!existingLoja) {
      return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });
    }

    // SYS_ADMIN can edit any lodge, ADMIN can only edit from their tenant
    if (user.role !== "SYS_ADMIN" && existingLoja.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Sem permissao para editar esta loja" }, { status: 403 });
    }

    if (!body.contatoNome || !String(body.contatoNome).trim()) {
      return NextResponse.json({ error: "Nome do contato e obrigatorio" }, { status: 400 });
    }

    // Update lodge
    const updatedLoja = await prisma.loja.update({
      where: { id },
      data: {
        lojaMX: body.lojaMX,
        numero: body.numero,
        potenciaId: body.potenciaId,
        ritoId: body.ritoId,
        situacao: body.situacao,
        dataFundacao: body.dataFundacao ? new Date(body.dataFundacao) : null,
        contractNumber: body.contractNumber,
        mensalidadeAtiva: body.mensalidadeAtiva,
        mensalidadeVencimentoDia: body.mensalidadeVencimentoDia !== undefined ? body.mensalidadeVencimentoDia : undefined,
        valorMensalidade: body.valorMensalidade !== undefined ? body.valorMensalidade : undefined,
        cnpj: body.cnpj || null,
        razaoSocial: body.razaoSocial || null,
        nomeFantasia: body.nomeFantasia || null,
        dataAbertura: body.dataAbertura ? new Date(body.dataAbertura) : null,
        contatoNome: String(body.contatoNome).trim(),
        email: body.email || null,
        telefone: body.telefone || null,
        website: body.website || null,
        enderecoLogradouro: body.enderecoLogradouro || null,
        enderecoNumero: body.enderecoNumero || null,
        enderecoComplemento: body.enderecoComplemento || null,
        enderecoBairro: body.enderecoBairro || null,
        enderecoCidade: body.enderecoCidade || null,
        enderecoUf: body.enderecoUf || null,
        enderecoCep: body.enderecoCep || null,
        // Dados bancários
        bancoCodigo: body.bancoCodigo || null,
        bancoNome: body.bancoNome || null,
        bancoAgencia: body.bancoAgencia || null,
        bancoAgenciaDigito: body.bancoAgenciaDigito || null,
        bancoConta: body.bancoConta || null,
        bancoContaDigito: body.bancoContaDigito || null,
        bancoTipoConta: body.bancoTipoConta || null,
        bancoPix: body.bancoPix || null,
        observacoes: body.observacoes || null,
      },
    });

    return NextResponse.json(updatedLoja);
  } catch (error) {
    console.error("PUT /api/lojas/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar loja" }, { status: 500 });
  }
}

// DELETE /api/lojas/[id] - Delete lodge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "SYS_ADMIN") {
      return NextResponse.json({ error: "Somente admin" }, { status: 403 });
    }

    const { id } = await params;

    const loja = await prisma.loja.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        lojaMX: true,
        _count: {
          select: {
            members: true,
            users: true,
            payments: true,
            duesCharges: true,
            kpiSnapshots: true,
            meetings: true,
          },
        },
      },
    });

    if (!loja) {
      return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });
    }

    // SYS_ADMIN can delete any lodge, ADMIN can only delete from their tenant
    if (user.role !== "SYS_ADMIN" && loja.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Sem permissao para excluir esta loja" }, { status: 403 });
    }

    // Check for any related records that would prevent deletion
    const blockers: string[] = [];
    if (loja._count.members > 0) blockers.push(`${loja._count.members} membro(s)`);
    if (loja._count.users > 0) blockers.push(`${loja._count.users} usuario(s)`);
    if (loja._count.payments > 0) blockers.push(`${loja._count.payments} pagamento(s)`);
    if (loja._count.duesCharges > 0) blockers.push(`${loja._count.duesCharges} cobranca(s)`);
    if (loja._count.kpiSnapshots > 0) blockers.push(`${loja._count.kpiSnapshots} snapshot(s) de KPI`);
    if (loja._count.meetings > 0) blockers.push(`${loja._count.meetings} sessao(oes)`);

    if (blockers.length > 0) {
      return NextResponse.json(
        {
          error: `Nao e possivel excluir a loja "${loja.lojaMX}". Existem registros associados`,
          details: blockers.join(", "),
        },
        { status: 400 }
      );
    }

    await prisma.loja.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/lojas/[id] error:", error);
    return NextResponse.json({ error: "Erro ao excluir loja" }, { status: 500 });
  }
}
