import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import {
  validateMeetingUpdate,
  type MeetingUpdateInput,
} from "@/lib/validations/presenca";
import { canMarkAttendance } from "@/lib/session-rules";

// GET /api/sessoes/[id] - Get meeting by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: {
        id: id,
        tenantId: auth.tenantId,
      },
      include: {
        loja: {
          select: {
            id: true,
            lojaMX: true,
            numero: true,
          },
        },
        attendances: {
          include: {
            member: {
              select: {
                id: true,
                nomeCompleto: true,
                class: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Verificar se permite marcar presença (data da sessão > hoje)
    const allowAttendance = canMarkAttendance(meeting.dataSessao);

    return NextResponse.json({
      ...meeting,
      canMarkAttendance: allowAttendance,
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/sessoes/[id] - Update meeting
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body: MeetingUpdateInput = await req.json();

    // Validate input
    const errors = validateMeetingUpdate(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Check if meeting exists and belongs to tenant
    const existing = await prisma.meeting.findUnique({
      where: {
        id: id,
        tenantId: auth.tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Update meeting
    const updateData: any = {};

    if (body.dataSessao !== undefined) {
      updateData.dataSessao = new Date(body.dataSessao);
    }
    if (body.tipo !== undefined) {
      updateData.tipo = body.tipo;
    }
    if (body.titulo !== undefined) {
      updateData.titulo = body.titulo || null;
    }
    if (body.descricao !== undefined) {
      updateData.descricao = body.descricao || null;
    }
    if (body.observacoes !== undefined) {
      updateData.observacoes = body.observacoes || null;
    }
    if (body.lojaId !== undefined) {
      updateData.lojaId = body.lojaId || null;
    }

    const meeting = await prisma.meeting.update({
      where: { id: id },
      data: updateData,
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

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessoes/[id] - Delete meeting
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if meeting exists and belongs to tenant
    const existing = await prisma.meeting.findUnique({
      where: {
        id: id,
        tenantId: auth.tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Delete meeting (cascade will delete attendances)
    await prisma.meeting.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
