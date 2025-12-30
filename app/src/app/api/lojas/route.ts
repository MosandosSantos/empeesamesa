import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  try {
    const lojas = await prisma.loja.findMany({
      where: { tenantId: payload!.tenantId },
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
