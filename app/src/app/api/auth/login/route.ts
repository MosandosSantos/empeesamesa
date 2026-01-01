import { NextRequest, NextResponse } from "next/server";
import { createToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("[Login] Tentativa de login para:", email);

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar usuário no banco de dados com dados da Loja
    // Nota: Usamos findFirst porque email não é unique sozinho (somente tenantId+email)
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: {
        loja: true, // Incluir dados da Loja para verificar status
      },
    });

    console.log("[Login] Usuário encontrado:", user ? "Sim" : "Não");

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Verificar se o usuário está ativo
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Usuário inativo. Verifique seu email para ativar sua conta." },
        { status: 403 }
      );
    }

    // Verificar se a Loja está ativa (regra SaaS)
    if (user.loja && user.loja.situacao !== "ATIVA") {
      return NextResponse.json(
        { error: "Loja inativa. Acesso suspenso. Entre em contato com o administrador." },
        { status: 403 }
      );
    }

    // Verificar senha
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    console.log("[Login] Senha válida:", isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Criar token JWT
    const token = await createToken({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
    });

    console.log("[Login] Token criado com sucesso");

    // Criar resposta com cookie httpOnly
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Configurar cookie httpOnly com JWT
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login] Erro completo:", error);
    console.error("[Login] Stack trace:", error instanceof Error ? error.stack : 'N/A');
    console.error("[Login] Mensagem:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
