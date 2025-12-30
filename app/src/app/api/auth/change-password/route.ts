import { NextRequest, NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";

/**
 * POST /api/auth/change-password
 * Permite que o usuário logado troque sua senha
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar usuário
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validação de entrada
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Senha atual, nova senha e confirmação são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de nova senha
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "A nova senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "As senhas não coincidem" },
        { status: 400 }
      );
    }

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se usuário tem senha definida
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Usuário ainda não definiu senha. Use o link de convite." },
        { status: 400 }
      );
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 401 }
      );
    }

    // Criar hash da nova senha
    const newPasswordHash = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Senha atualizada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Change Password] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao trocar senha",
        details: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
