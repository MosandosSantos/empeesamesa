import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import {
  validateMeetingCreate,
  type MeetingCreateInput,
} from "@/lib/validations/presenca";

// GET /api/sessoes - List meetings
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const lojaId = searchParams.get("lojaId");
    const tipo = searchParams.get("tipo");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const where: any = {
      tenantId: auth.tenantId,
    };

    if (lojaId) {
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
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const meeting = await prisma.meeting.create({
      data: {
        tenantId: auth.tenantId,
        dataSessao: new Date(body.dataSessao),
        tipo: body.tipo,
        titulo: body.titulo || null,
        descricao: body.descricao || null,
        observacoes: body.observacoes || null,
        lojaId: body.lojaId || null,
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
