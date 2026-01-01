import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateInviteToken, markTokenAsUsed } from "@/lib/invite-token";

/**
 * POST /api/auth/set-password
 * Define senha de um usuário via token de convite
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // Validação de entrada
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Token, senha e confirmação são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "As senhas não coincidem" },
        { status: 400 }
      );
    }

    // Validar token de convite
    const tokenData = await validateInviteToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Solicite um novo convite." },
        { status: 400 }
      );
    }

    // Criar hash da senha
    const passwordHash = await hashPassword(password);

    // Atualizar usuário: definir senha e status ACTIVE
    await prisma.user.update({
      where: { id: tokenData },
      data: {
        passwordHash,
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    });

    // Marcar token como usado
    await markTokenAsUsed(token);

    return NextResponse.json(
      {
        success: true,
        message: "Senha criada com sucesso. Você já pode fazer login.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Set Password] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao definir senha",
        details: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
