import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { isValidTipoLancamento, TipoLancamento } from "@/types/financeiro";

/**
 * GET /api/categorias
 * List all categories for the authenticated tenant
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[API Categorias] Recebendo requisição GET");
    const { payload, error } = await verifyAuth(request);
    if (error) {
      console.log("[API Categorias] Erro de autenticação");
      return error;
    }

    console.log("[API Categorias] Tenant ID:", payload!.tenantId);

    const tipoParam = request.nextUrl.searchParams.get("tipo");
    if (tipoParam && !isValidTipoLancamento(tipoParam)) {
      return NextResponse.json(
        { error: "Tipo invalido" },
        { status: 400 }
      );
    }

    const categorias = await prisma.categoria.findMany({
      where: {
        tenantId: payload!.tenantId,
        ...(tipoParam ? { tipo: tipoParam } : {}),
      },
      orderBy: {
        nome: "asc",
      },
    });

    console.log("[API Categorias] Categorias encontradas:", categorias.length);
    console.log("[API Categorias] Categorias:", categorias);

    return NextResponse.json({ categorias });
  } catch (error) {
    console.error("GET /api/categorias error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categorias
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const body = await request.json();
    const { nome, tipo } = body;
    const tipoValue = tipo ?? TipoLancamento.DESPESA;

    if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    if (!isValidTipoLancamento(tipoValue)) {
      return NextResponse.json(
        { error: "Tipo invalido" },
        { status: 400 }
      );
    }

    // Check if category already exists for this tenant
    const existing = await prisma.categoria.findUnique({
      where: {
        tenantId_nome_tipo: {
          tenantId: payload!.tenantId,
          nome: nome.trim(),
          tipo: tipoValue,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Categoria já existe" },
        { status: 409 }
      );
    }

    const categoria = await prisma.categoria.create({
      data: {
        tenantId: payload!.tenantId,
        nome: nome.trim(),
        tipo: tipoValue,
      },
    });

    return NextResponse.json({ categoria }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categorias error:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}
