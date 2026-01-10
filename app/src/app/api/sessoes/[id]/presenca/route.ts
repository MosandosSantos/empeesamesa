import { NextRequest, NextResponse } from "next/server";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import {
  validateAttendanceBulk,
  type AttendanceBulkInput,
} from "@/lib/validations/presenca";
import {
  canMarkAttendance,
  getAttendanceBlockedMessage,
  getAttendanceBlockedCode,
} from "@/lib/session-rules";
import { canAccessPresence, isLojaAdmin, isSecretaria } from "@/lib/roles";

// POST /api/sessoes/[id]/presenca - Mark attendance (bulk)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  try {
    const body: AttendanceBulkInput = await req.json();

    // Validate input
    const errors = validateAttendanceBulk(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Check if meeting exists and belongs to tenant
    const meeting = await prisma.meeting.findUnique({
      where: {
        id: id,
        tenantId: payload!.tenantId,
      },
    });

    if (needsLojaRestriction && meeting.lojaId && meeting.lojaId != user.lojaId) {
      return NextResponse.json({ error: "Voce nao tem permissao para esta sessao" }, { status: 403 });
    }

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Verificar se permite marcar presença (data da sessão > hoje)
    if (!canMarkAttendance(meeting.dataSessao)) {
      return NextResponse.json(
        {
          allowed: false,
          code: getAttendanceBlockedCode(),
          error: getAttendanceBlockedMessage(),
        },
        { status: 403 }
      );
    }

    console.log("=== API: RECEBENDO PRESENÇAS ===");
    console.log(`Total de presenças recebidas: ${body.attendances.length}`);
    const statusCount = body.attendances.reduce((acc: any, att: any) => {
      acc[att.status] = (acc[att.status] || 0) + 1;
      return acc;
    }, {});
    console.log("Contagem por status:", statusCount);

    // Upsert attendances (create or update)
    const results = await Promise.all(
      body.attendances.map(async (att) => {
        return prisma.attendance.upsert({
          where: {
            meetingId_memberId: {
              meetingId: id,
              memberId: att.memberId,
            },
          },
          create: {
            tenantId: payload!.tenantId,
            meetingId: id,
            memberId: att.memberId,
            status: att.status,
            observacoes: att.observacoes || null,
          },
          update: {
            status: att.status,
            observacoes: att.observacoes || null,
          },
          include: {
            member: {
              select: {
                id: true,
                nomeCompleto: true,
                class: true,
              },
            },
          },
        });
      })
    );

    return NextResponse.json({ attendances: results }, { status: 200 });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/sessoes/[id]/presenca - Get attendance for meeting
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  try {
    // Check if meeting exists and belongs to tenant
    const meeting = await prisma.meeting.findUnique({
      where: {
        id: id,
        tenantId: payload!.tenantId,
      },
    });

    if (needsLojaRestriction && meeting.lojaId && meeting.lojaId != user.lojaId) {
      return NextResponse.json({ error: "Voce nao tem permissao para esta sessao" }, { status: 403 });
    }

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        meetingId: id,
        tenantId: payload!.tenantId,
      },
      include: {
        member: {
          select: {
            id: true,
            nomeCompleto: true,
            class: true,
            situacao: true,
          },
        },
      },
      orderBy: {
        member: {
          nomeCompleto: "asc",
        },
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
