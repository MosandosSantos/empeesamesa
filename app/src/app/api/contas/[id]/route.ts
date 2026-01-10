import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { verifyAuth } from "@/lib/api-auth";
import {
  validateLancamentoUpdate,
  LancamentoUpdateInput,
} from "@/lib/validations/lancamento";

const prisma = new PrismaClient();

/**
 * GET /api/contas/[id]
 * Get a single lancamento by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const { id } = await params;

    const lancamento = await prisma.lancamento.findUnique({
      where: { id },
      include: {
        categoria: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!lancamento || lancamento.tenantId !== payload!.tenantId) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ lancamento });
  } catch (error) {
    console.error("GET /api/contas/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lançamento" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contas/[id]
 * Update a lancamento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const { id } = await params;
    const body: LancamentoUpdateInput = await request.json();

    // Validate input
    const validationErrors = validateLancamentoUpdate(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Dados inválidos", errors: validationErrors },
        { status: 400 }
      );
    }

    // Verify lancamento exists and belongs to tenant
    const existing = await prisma.lancamento.findUnique({
      where: { id },
    });

    if (!existing || existing.tenantId !== payload!.tenantId) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    const nextTipo = body.tipo ?? existing.tipo;
    const nextCategoriaId = body.categoriaId ?? existing.categoriaId;

    if (body.categoriaId || body.tipo) {
      const categoria = await prisma.categoria.findUnique({
        where: { id: nextCategoriaId },
      });

      if (!categoria || categoria.tenantId !== payload!.tenantId) {
        return NextResponse.json(
          { error: "Categoria nao encontrada" },
          { status: 404 }
        );
      }

      if (categoria.tipo !== nextTipo) {
        return NextResponse.json(
          { error: "Categoria nao compativel com o tipo do lancamento" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Prisma.LancamentoUpdateInput = {};

    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.categoriaId !== undefined) updateData.categoriaId = body.categoriaId;
    if (body.descricao !== undefined) updateData.descricao = body.descricao.trim();
    if (body.valorPrevisto !== undefined) updateData.valorPrevisto = body.valorPrevisto;
    if (body.valorPago !== undefined) updateData.valorPago = body.valorPago;
    if (body.dataVencimento !== undefined) updateData.dataVencimento = new Date(body.dataVencimento);
    if (body.dataPagamento !== undefined) {
      updateData.dataPagamento = body.dataPagamento ? new Date(body.dataPagamento) : null;
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.formaPagamento !== undefined) updateData.formaPagamento = body.formaPagamento || null;
    if (body.anexo !== undefined) updateData.anexo = body.anexo || null;

    const lancamento = await prisma.lancamento.update({
      where: { id },
      data: updateData,
      include: {
        categoria: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return NextResponse.json({ lancamento });
  } catch (error) {
    console.error("PUT /api/contas/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lançamento" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contas/[id]
 * Delete a lancamento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const { id } = await params;

    // Verify lancamento exists and belongs to tenant
    const existing = await prisma.lancamento.findUnique({
      where: { id },
    });

    if (!existing || existing.tenantId !== payload!.tenantId) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    await prisma.lancamento.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contas/[id] error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir lançamento" },
      { status: 500 }
    );
  }
}
