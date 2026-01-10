import { NextRequest, NextResponse } from "next/server";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import {
  validateMeetingCreate,
  type MeetingCreateInput,
} from "@/lib/validations/presenca";
import { canAccessPresence, isLojaAdmin, isSecretaria } from "@/lib/roles";

// GET /api/sessoes - List meetings
export async function GET(req: NextRequest) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  const user = await getUserFromPayload(payload!);
  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  if (!canAccessPresence(user.role)) {
    return NextResponse.json({ error: "Voce nao tem permissao para acessar presenca" }, { status: 403 });
  }

  const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role);
  if (needsLojaRestriction && !user.lojaId) {
    return NextResponse.json({ error: "Usuario sem loja vinculada" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const lojaId = searchParams.get("lojaId");
    const tipo = searchParams.get("tipo");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const where: any = {
      tenantId: payload!.tenantId,
      ...(needsLojaRestriction ? { lojaId: user.lojaId } : {}),
    };

    if (lojaId && !needsLojaRestriction) {
      where.lojaId = lojaId;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (dataInicio || dataFim) {
      where.dataSessao = {};
      if (dataInicio) {
        where.dataSessao.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataSessao.lte = new Date(dataFim);
      }
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        loja: {
          select: {
            id: true,
            lojaMX: true,
            numero: true,
          },
        },
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: {
        dataSessao: "desc",
      },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/sessoes - Create meeting
export async function POST(req: NextRequest) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  const user = await getUserFromPayload(payload!);
  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  if (!canAccessPresence(user.role)) {
    return NextResponse.json({ error: "Voce nao tem permissao para criar sessao" }, { status: 403 });
  }

  const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role);
  if (needsLojaRestriction && !user.lojaId) {
    return NextResponse.json({ error: "Usuario sem loja vinculada" }, { status: 403 });
  }

  try {
    const body: MeetingCreateInput = await req.json();

    // Validate input
    const errors = validateMeetingCreate(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Create meeting
    const effectiveLojaId = needsLojaRestriction ? user.lojaId : body.lojaId;
    if (needsLojaRestriction && body.lojaId && body.lojaId !== user.lojaId) {
      return NextResponse.json({ error: "Loja invalida para este usuario" }, { status: 403 });
    }

    const meeting = await prisma.meeting.create({
      data: {
        tenantId: payload!.tenantId,
        dataSessao: new Date(body.dataSessao),
        tipo: body.tipo,
        titulo: body.titulo || null,
        descricao: body.descricao || null,
        observacoes: body.observacoes || null,
        lojaId: effectiveLojaId || null,
      },
      include: {
        loja: {
          select: {
            id: true,
            lojaMX: true,
            numero: true,
          },
        },
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
