import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { verifyAuth } from "@/lib/api-auth";
import {
  validateLancamentoCreate,
  LancamentoCreateInput,
} from "@/lib/validations/lancamento";

const prisma = new PrismaClient();

/**
 * GET /api/contas
 * List lancamentos with filters
 * Query params: tipo, status, categoriaId, dataInicio, dataFim, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const status = searchParams.get("status");
    const categoriaId = searchParams.get("categoriaId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: Prisma.LancamentoWhereInput = {
      tenantId: payload!.tenantId,
    };

    if (tipo) {
      where.tipo = tipo;
    }

    if (status) {
      where.status = status;
    }

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    if (dataInicio || dataFim) {
      where.dataVencimento = {};
      if (dataInicio) {
        where.dataVencimento.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataVencimento.lte = new Date(dataFim);
      }
    }

    // Fetch lancamentos with pagination
    const [lancamentos, total] = await Promise.all([
      prisma.lancamento.findMany({
        where,
        include: {
          categoria: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          dataVencimento: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lancamento.count({ where }),
    ]);

    return NextResponse.json({
      lancamentos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/contas error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lançamentos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contas
 * Create a new lancamento
 */
export async function POST(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const body: LancamentoCreateInput = await request.json();

    // Validate input
    const validationErrors = validateLancamentoCreate(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Dados inválidos", errors: validationErrors },
        { status: 400 }
      );
    }

    // Verify categoria exists and belongs to tenant
    const categoria = await prisma.categoria.findUnique({
      where: { id: body.categoriaId },
    });

    if (!categoria || categoria.tenantId !== payload!.tenantId) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    // Create lancamento
    const lancamento = await prisma.lancamento.create({
      data: {
        tenantId: payload!.tenantId,
        tipo: body.tipo,
        categoriaId: body.categoriaId,
        descricao: body.descricao.trim(),
        valorPrevisto: body.valorPrevisto,
        valorPago: body.valorPago || 0,
        dataVencimento: new Date(body.dataVencimento),
        dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : null,
        status: body.status,
        formaPagamento: body.formaPagamento || null,
        anexo: body.anexo || null,
      },
      include: {
        categoria: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return NextResponse.json({ lancamento }, { status: 201 });
  } catch (error) {
    console.error("POST /api/contas error:", error);
    return NextResponse.json(
      { error: "Erro ao criar lançamento" },
      { status: 500 }
    );
  }
}
