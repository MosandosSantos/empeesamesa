import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { createUserAndInvite } from "@/lib/user-invite";

export async function POST(req: NextRequest) {
  const { payload: auth, error } = await verifyAuth(req);
  if (error) {
    return error;
  }

  try {
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

    // Verificar se já existe membro com mesmo número de filiado (se fornecido)
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
          { error: "Já existe um membro cadastrado com este número de filiado" },
          { status: 409 }
        );
      }
    }

    // Criar o membro
    const member = await prisma.member.create({
      data: {
        tenantId: auth!.tenantId,
        lojaId: lojaId || null,
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
          lojaId: lojaId || null,
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
  } catch (error: any) {
    console.error("Erro ao criar membro:", error);

    // Tratar erros específicos do Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Já existe um membro com estes dados únicos (CPF ou número de filiado)" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao cadastrar membro", details: error.message },
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
    const members = await prisma.member.findMany({
      where: { tenantId: auth!.tenantId },
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
