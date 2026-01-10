import { NextRequest, NextResponse } from 'next/server';
import { getUserFromPayload, verifyAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { canManageMembers, canViewMembers, isLojaAdmin, isPotAdmin, isSecretaria, isTesouraria } from '@/lib/roles';

const toDateOrNull = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  const { id } = await params;

  try {
    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }
    if (!canViewMembers(user.role)) {
      return NextResponse.json({ error: 'Sem permissao para visualizar membros' }, { status: 403 });
    }

    const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role) || isTesouraria(user.role);
    const needsPotRestriction = isPotAdmin(user.role);

    if (needsLojaRestriction && !user.lojaId) {
      return NextResponse.json({ error: 'Usuario sem loja vinculada' }, { status: 403 });
    }

    if (needsPotRestriction && !user.potenciaId) {
      return NextResponse.json({ error: 'Usuario sem prefeitura vinculada' }, { status: 403 });
    }

    const member = await prisma.member.findFirst({
      where: {
        id,
        tenantId: payload!.tenantId,
        ...(needsLojaRestriction ? { lojaId: user.lojaId } : {}),
        ...(needsPotRestriction ? { loja: { potenciaId: user.potenciaId } } : {}),
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  const { id } = await params;

  try {
    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 401 });
    }
    if (!canManageMembers(user.role)) {
      return NextResponse.json({ error: 'Sem permissao para editar membros' }, { status: 403 });
    }
    if ((isLojaAdmin(user.role) || isSecretaria(user.role)) && !user.lojaId) {
      return NextResponse.json({ error: 'Usuario sem loja vinculada' }, { status: 403 });
    }

    const body = await req.json();

    const updated = await prisma.member.updateMany({
      where: {
        id,
        tenantId: payload!.tenantId,
        ...(isLojaAdmin(user.role) || isSecretaria(user.role) ? { lojaId: user.lojaId } : {}),
      },
      data: {
        nomeCompleto: body.nomeCompleto,
        email: body.email,
        dataNascimento: toDateOrNull(body.dataNascimento),
        pai: body.pai ?? "",
        mae: body.mae ?? "",
        naturalCidade: body.naturalCidade ?? "",
        naturalUf: body.naturalUf ?? "",
        nacionalidade: body.nacionalidade ?? "Brasileira",
        estadoCivil: body.estadoCivil ?? "SOLTEIRO",
        identidadeNumero: body.identidadeNumero ?? "",
        orgaoEmissor: body.orgaoEmissor ?? "",
        dataEmissao: toDateOrNull(body.dataEmissao),
        celular: body.celular ?? "",
        telefoneUrgencia: body.telefoneUrgencia ?? "",
        enderecoLogradouro: body.enderecoLogradouro ?? "",
        enderecoNumero: body.enderecoNumero ?? "",
        enderecoComplemento: body.enderecoComplemento ?? "",
        enderecoCep: body.enderecoCep ?? "",
        enderecoBairro: body.enderecoBairro ?? "",
        enderecoCidade: body.enderecoCidade ?? "",
        enderecoUf: body.enderecoUf ?? "",
        escolaridade: body.escolaridade ?? "OUTRO",
        rito: body.rito ?? null,
        dataEntradaLojaAtual: toDateOrNull(body.dataEntradaLojaAtual),
        situacao: body.situacao ?? "ATIVO",
        condicaoMensalidade: body.condicaoMensalidade ?? "REGULAR",
        class: body.class ?? null,
        dataMESA: toDateOrNull(body.dataMESA),
        dataEN: toDateOrNull(body.dataEN),
        dataCBCS: toDateOrNull(body.dataCBCS),
        dataIniciacao: toDateOrNull(body.dataIniciacao),
        lojaIniciacaoNome: body.lojaIniciacaoNome ?? null,
        lojaIniciacaoNumero: body.lojaIniciacaoNumero ?? null,
        dataPassagem: toDateOrNull(body.dataPassagem),
        lojaPassagemNome: body.lojaPassagemNome ?? null,
        lojaPassagemNumero: body.lojaPassagemNumero ?? null,
        dataElevacao: toDateOrNull(body.dataElevacao),
        lojaElevacaoNome: body.lojaElevacaoNome ?? null,
        lojaElevacaoNumero: body.lojaElevacaoNumero ?? null,
        dataInstalacao: toDateOrNull(body.dataInstalacao),
        lojaInstalacaoNome: body.lojaInstalacaoNome ?? null,
        lojaInstalacaoNumero: body.lojaInstalacaoNumero ?? null,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating member:', err);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}
