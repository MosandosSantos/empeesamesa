import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

// GET /api/lojas/[id]/valores - Get lodge payment values
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const { id } = await params;

  const loja = await prisma.loja.findUnique({
    where: { id },
    select: {
      id: true,
      valorMensalidade: true,
      valorAnuidade: true,
      mensalidadeRegular: true,
      mensalidadeFiliado: true,
      mensalidadeRemido: true,
    },
  });

    if (!loja) {
      return NextResponse.json({ error: "Loja nao encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      valorMensalidade: loja.valorMensalidade?.toString() || "150.00",
      valorAnuidade: loja.valorAnuidade?.toString() || "500.00",
      mensalidadeRegular:
        loja.mensalidadeRegular?.toString() ||
        loja.valorMensalidade?.toString() ||
        "150.00",
      mensalidadeFiliado:
        loja.mensalidadeFiliado?.toString() ||
        loja.valorMensalidade?.toString() ||
        "150.00",
      mensalidadeRemido:
        loja.mensalidadeRemido?.toString() ||
        loja.valorMensalidade?.toString() ||
        "150.00",
    });
  } catch (error) {
    console.error("GET /api/lojas/[id]/valores error:", error);
    return NextResponse.json({ error: "Erro ao buscar valores da loja" }, { status: 500 });
  }
}
