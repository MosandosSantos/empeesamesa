import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { resendInvite } from "@/lib/user-invite";

/**
 * POST /api/users/invite
 * Reenvia convite para um usuário existente com status INVITED
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

    const currentUser = await getUserFromPayload(auth);
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    // Apenas administradores do sistema podem reenviar convites
    if (!isSaasAdmin(currentUser.role)) {
      return NextResponse.json(
        { error: "Sem permissão para reenviar convites" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Reenviar convite
    const result = await resendInvite(userId);

    return NextResponse.json(
      {
        success: true,
        message: "Convite reenviado com sucesso",
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Invite] Erro ao reenviar convite:", error);

    if (error instanceof Error) {
      // Erros específicos
      if (error.message === "Usuário não encontrado") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "Usuário já ativado") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      {
        error: "Erro ao reenviar convite",
        details: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
