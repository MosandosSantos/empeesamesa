import { NextRequest, NextResponse } from "next/server";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { createUserAndInvite } from "@/lib/user-invite";
import { canManageMembers, canViewMembers, isPotAdmin, isSecretaria, isTesouraria, isLojaAdmin } from "@/lib/roles";

export async function POST(req: NextRequest) {
  const { payload: auth, error } = await verifyAuth(req);
  if (error) {
    return error;
  }

  try {
    const user = await getUserFromPayload(auth!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }
    if (!canManageMembers(user.role)) {
      return NextResponse.json({ error: "Sem permissao para cadastrar membros" }, { status: 403 });
    }
    if ((isLojaAdmin(user.role) || isSecretaria(user.role)) && !user.lojaId) {
      return NextResponse.json({ error: "Usuario sem loja vinculada" }, { status: 403 });
    }

    const body = await req.json();

    // Extrair todos os campos do formulário
    const {
      lojaId,
      lojaAtualNome,
      lojaAtualNumero,
      dataEntradaLojaAtual,
      rito,
      dataAdmissao,
      tipoAdmissao,
      numeroFiliado,
      nomeCompleto,
      dataNascimento,
      pai,
      mae,
      naturalCidade,
      naturalUf,
      nacionalidade,
      estadoCivil,
      identidadeNumero,
      orgaoEmissor,
      dataEmissao,
      cpf,
      email,
      celular,
      telefoneUrgencia,
      enderecoLogradouro,
      enderecoNumero,
      enderecoComplemento,
      enderecoCep,
      enderecoBairro,
      enderecoCidade,
      enderecoUf,
      escolaridade,
      dataIniciacao,
      lojaIniciacaoNome,
      lojaIniciacaoNumero,
      potenciaIniciacaoId,
      dataPassagem,
      lojaPassagemNome,
      lojaPassagemNumero,
      potenciaPassagemId,
      dataElevacao,
      lojaElevacaoNome,
      lojaElevacaoNumero,
      potenciaElevacaoId,
      dataInstalacao,
      lojaInstalacaoNome,
      lojaInstalacaoNumero,
      potenciaInstalacaoId,
      situacao,
      condicaoMensalidade,
      class: memberClass,
      fotoUrl,
      dataMESA,
      dataEN,
      dataCBCS,
    } = body;

    // Validações básicas
    if (!nomeCompleto || !cpf || !email || !dataNascimento || !dataAdmissao) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos: nome, CPF, email, data de nascimento e data de admissão" },
        { status: 400 }
      );
    }

    // Verificar se já existe membro com mesmo CPF no tenant
    const existingByCpf = await prisma.member.findUnique({
      where: {
        tenantId_cpf: {
          tenantId: auth!.tenantId,
          cpf: cpf,
        },
      },
    });

    if (existingByCpf) {
      return NextResponse.json(
        { error: "Já existe um membro cadastrado com este CPF" },
        { status: 409 }
      );
    }

    // Verificar se já existe membro com mesmo Cadastro Maçônico (se fornecido)
    if (numeroFiliado) {
      const existingByNumero = await prisma.member.findUnique({
        where: {
          tenantId_numeroFiliado: {
            tenantId: auth!.tenantId,
            numeroFiliado: numeroFiliado,
          },
        },
      });

      if (existingByNumero) {
        return NextResponse.json(
          { error: "Já existe um membro cadastrado com este Cadastro Maçônico" },
          { status: 409 }
        );
      }
    }

    const resolvedLojaId =
      isLojaAdmin(user.role) || isSecretaria(user.role)
        ? user.lojaId
        : lojaId;

    if (!resolvedLojaId) {
      return NextResponse.json({ error: "Loja obrigatoria para cadastro" }, { status: 400 });
    }

    // Criar o membro
    const member = await prisma.member.create({
      data: {
        tenantId: auth!.tenantId,
        lojaId: resolvedLojaId,
        lojaAtualNome: lojaAtualNome || null,
        lojaAtualNumero: lojaAtualNumero || null,
        dataEntradaLojaAtual: dataEntradaLojaAtual ? new Date(dataEntradaLojaAtual) : null,
        rito: rito || null,
        dataAdmissao: new Date(dataAdmissao),
        tipoAdmissao: tipoAdmissao || "INIC",
        numeroFiliado: numeroFiliado || null,
        nomeCompleto,
        dataNascimento: new Date(dataNascimento),
        pai: pai || "",
        mae: mae || "",
        naturalCidade: naturalCidade || "",
        naturalUf: naturalUf || "",
        nacionalidade: nacionalidade || "Brasileira",
        estadoCivil: estadoCivil || "SOLTEIRO",
        identidadeNumero: identidadeNumero || "",
        orgaoEmissor: orgaoEmissor || "",
        dataEmissao: dataEmissao ? new Date(dataEmissao) : new Date(),
        cpf,
        email,
        celular: celular || "",
        telefoneUrgencia: telefoneUrgencia || "",
        enderecoLogradouro: enderecoLogradouro || "",
        enderecoNumero: enderecoNumero || "",
        enderecoComplemento: enderecoComplemento || "",
        enderecoCep: enderecoCep || "",
        enderecoBairro: enderecoBairro || "",
        enderecoCidade: enderecoCidade || "",
        enderecoUf: enderecoUf || "",
        escolaridade: escolaridade || "OUTRO",
        dataIniciacao: dataIniciacao ? new Date(dataIniciacao) : null,
        lojaIniciacaoNome: lojaIniciacaoNome || null,
        lojaIniciacaoNumero: lojaIniciacaoNumero || null,
        potenciaIniciacaoId: potenciaIniciacaoId || null,
        dataPassagem: dataPassagem ? new Date(dataPassagem) : null,
        lojaPassagemNome: lojaPassagemNome || null,
        lojaPassagemNumero: lojaPassagemNumero || null,
        potenciaPassagemId: potenciaPassagemId || null,
        dataElevacao: dataElevacao ? new Date(dataElevacao) : null,
        lojaElevacaoNome: lojaElevacaoNome || null,
        lojaElevacaoNumero: lojaElevacaoNumero || null,
        potenciaElevacaoId: potenciaElevacaoId || null,
        dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : null,
        lojaInstalacaoNome: lojaInstalacaoNome || null,
        lojaInstalacaoNumero: lojaInstalacaoNumero || null,
        potenciaInstalacaoId: potenciaInstalacaoId || null,
        condicaoMensalidade: condicaoMensalidade || "REGULAR",
        situacao: situacao || "ATIVO",
        class: memberClass || null,
        fotoUrl: fotoUrl || null,
        dataMESA: dataMESA ? new Date(dataMESA) : null,
        dataEN: dataEN ? new Date(dataEN) : null,
        dataCBCS: dataCBCS ? new Date(dataCBCS) : null,
      },
    });

    // Criar usuário e enviar convite por email (se tiver email)
    let userInviteResult;
    if (email && email.trim()) {
      try {
        userInviteResult = await createUserAndInvite({
          email: email.toLowerCase(),
          tenantId: auth!.tenantId,
          lojaId: resolvedLojaId,
          role: "MEMBER", // Todo novo membro começa como MEMBER
          createdByUserId: auth!.userId,
          userName: nomeCompleto,
        });

        console.log(`[Membro] Convite enviado para ${email}:`, userInviteResult);
      } catch (inviteError) {
        console.error("[Membro] Erro ao enviar convite:", inviteError);
        // Não falhar a criação do membro se o convite falhar
      }
    }

    return NextResponse.json({
      success: true,
      message: "Membro cadastrado com sucesso",
      member: {
        id: member.id,
        nomeCompleto: member.nomeCompleto,
        cpf: member.cpf,
        email: member.email,
      },
      userInvite: userInviteResult || null,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Erro ao criar membro:", error);

    // Tratar erros específicos do Prisma
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um membro com estes dados únicos (CPF ou Cadastro Maçônico)" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao cadastrar membro", details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { payload: auth, error } = await verifyAuth(req);
  if (error) {
    return error;
  }

  try {
    const user = await getUserFromPayload(auth!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }
    if (!canViewMembers(user.role)) {
      return NextResponse.json({ error: "Sem permissao para visualizar membros" }, { status: 403 });
    }

    const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role) || isTesouraria(user.role);
    const needsPotRestriction = isPotAdmin(user.role);

    if (needsLojaRestriction && !user.lojaId) {
      return NextResponse.json({ error: "Usuario sem loja vinculada" }, { status: 403 });
    }

    if (needsPotRestriction && !user.potenciaId) {
      return NextResponse.json({ error: "Usuario sem prefeitura vinculada" }, { status: 403 });
    }

    const members = await prisma.member.findMany({
      where: {
        tenantId: auth!.tenantId,
        ...(needsLojaRestriction ? { lojaId: user.lojaId } : {}),
        ...(needsPotRestriction ? { loja: { potenciaId: user.potenciaId } } : {}),
      },
      orderBy: { nomeCompleto: "asc" },
      select: {
        id: true,
        nomeCompleto: true,
        cpf: true,
        email: true,
        situacao: true,
        class: true,
        dataAP: true,
        dataCM: true,
        dataMM: true,
        dataMI: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Erro ao listar membros:", error);
    return NextResponse.json(
      { error: "Erro ao listar membros" },
      { status: 500 }
    );
  }
}
