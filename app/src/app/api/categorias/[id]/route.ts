import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAuth } from "@/lib/api-auth";

const prisma = new PrismaClient();

/**
 * PUT /api/categorias/[id]
 * Update a category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { nome } = body;

    if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Verify category belongs to tenant
    const existing = await prisma.categoria.findUnique({
      where: { id },
    });

    if (!existing || existing.tenantId !== payload!.tenantId) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another category
    const conflict = await prisma.categoria.findFirst({
      where: {
        tenantId: payload!.tenantId,
        nome: nome.trim(),
        tipo: existing.tipo,
        id: { not: id },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Já existe outra categoria com este nome" },
        { status: 409 }
      );
    }

    const categoria = await prisma.categoria.update({
      where: { id },
      data: {
        nome: nome.trim(),
      },
    });

    return NextResponse.json({ categoria });
  } catch (error) {
    console.error("PUT /api/categorias/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categorias/[id]
 * Delete a category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const { id } = await params;

    // Verify category belongs to tenant
    const existing = await prisma.categoria.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lancamentos: true },
        },
      },
    });

    if (!existing || existing.tenantId !== payload!.tenantId) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    // Check if category has associated lancamentos
    if (existing._count.lancamentos > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir categoria com lançamentos associados" },
        { status: 400 }
      );
    }

    await prisma.categoria.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/categorias/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir categoria" },
      { status: 500 }
    );
  }
}
