import { NextRequest, NextResponse } from "next/server";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { isLojaAdmin, isSecretaria, isTesouraria } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  try {
    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role) || isTesouraria(user.role);
    const needsPotRestriction = user.role === "ADMIN_POT";

    if (needsLojaRestriction && !user.lojaId) {
      return NextResponse.json({ error: "Usuario sem loja vinculada" }, { status: 403 });
    }

    if (needsPotRestriction && !user.potenciaId) {
      return NextResponse.json({ error: "Usuario sem prefeitura vinculada" }, { status: 403 });
    }

    const lojas = await prisma.loja.findMany({
      where: {
        tenantId: payload!.tenantId,
        ...(needsLojaRestriction ? { id: user.lojaId } : {}),
        ...(needsPotRestriction ? { potenciaId: user.potenciaId } : {}),
      },
      orderBy: { lojaMX: "asc" },
      select: {
        id: true,
        lojaMX: true,
        numero: true,
      },
    });

    return NextResponse.json({ lojas });
  } catch (err) {
    console.error("Erro ao listar lojas:", err);
    return NextResponse.json(
      { error: "Erro ao listar lojas" },
      { status: 500 }
    );
  }
}
