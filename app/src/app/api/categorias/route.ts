import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

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

    const categorias = await prisma.categoria.findMany({
      where: {
        tenantId: payload!.tenantId,
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
    const { nome } = body;

    if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Check if category already exists for this tenant
    const existing = await prisma.categoria.findUnique({
      where: {
        tenantId_nome: {
          tenantId: payload!.tenantId,
          nome: nome.trim(),
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
