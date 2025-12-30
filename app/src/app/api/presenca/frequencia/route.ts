import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { canMarkAttendance } from "@/lib/session-rules";

// GET /api/presenca/frequencia - Get attendance frequency data
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const lojaId = searchParams.get("lojaId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    // Build filter for meetings
    const meetingWhere: any = {
      tenantId: auth.tenantId,
    };

    if (lojaId) {
      meetingWhere.lojaId = lojaId;
    }

    if (dataInicio || dataFim) {
      meetingWhere.dataSessao = {};
      if (dataInicio) {
        meetingWhere.dataSessao.gte = new Date(dataInicio);
      }
      if (dataFim) {
        meetingWhere.dataSessao.lte = new Date(dataFim);
      }
    }

    // Get meetings for the period
    const allMeetings = await prisma.meeting.findMany({
      where: meetingWhere,
      select: {
        id: true,
        dataSessao: true,
        tipo: true,
        titulo: true,
      },
      orderBy: {
        dataSessao: "asc",
      },
    });

    // Filtrar apenas sessões que permitem marcação de presença (dataSessao <= hoje)
    // Apenas sessões que já aconteceram devem contar na frequência
    const meetings = allMeetings.filter((meeting) =>
      canMarkAttendance(meeting.dataSessao)
    );

    // Get all active members
    const members = await prisma.member.findMany({
      where: {
        tenantId: auth.tenantId,
        situacao: "ATIVO",
      },
      select: {
        id: true,
        nomeCompleto: true,
        class: true,
      },
      orderBy: {
        nomeCompleto: "asc",
      },
    });

    // Get all attendances for these meetings
    const meetingIds = meetings.map((m) => m.id);
    const attendances = await prisma.attendance.findMany({
      where: {
        tenantId: auth.tenantId,
        meetingId: { in: meetingIds },
      },
      select: {
        meetingId: true,
        memberId: true,
        status: true,
      },
    });

    console.log("=== API FREQUÊNCIA - DEBUG ===");
    console.log(`Sessões encontradas: ${meetings.length}`);
    console.log(`Membros ativos: ${members.length}`);
    console.log(`Registros de presença: ${attendances.length}`);
    console.log("Primeiros 5 registros de presença:");
    attendances.slice(0, 5).forEach((att) => {
      console.log(`  Meeting: ${att.meetingId.substring(0, 8)}... | Member: ${att.memberId.substring(0, 8)}... | Status: ${att.status}`);
    });

    // Build attendance map for quick lookup
    const attendanceMap = new Map<string, string>();
    attendances.forEach((att) => {
      const key = `${att.memberId}_${att.meetingId}`;
      attendanceMap.set(key, att.status);
    });

    // Calculate statistics for each member
    const memberStats = members.map((member) => {
      let totalPresent = 0;
      let totalRecorded = 0;

      meetings.forEach((meeting) => {
        const key = `${member.id}_${meeting.id}`;
        const status = attendanceMap.get(key);

        if (status) {
          totalRecorded++;
          if (status === "PRESENTE") {
            totalPresent++;
          }
        }
      });

      const percentage =
        totalRecorded > 0
          ? Math.round((totalPresent / totalRecorded) * 100)
          : 0;

      return {
        memberId: member.id,
        memberName: member.nomeCompleto,
        memberClass: member.class,
        totalPresent,
        totalRecorded,
        percentage,
      };
    });

    return NextResponse.json({
      meetings,
      members,
      attendances: Array.from(attendanceMap.entries()).map(([key, status]) => {
        const [memberId, meetingId] = key.split("_");
        return { memberId, meetingId, status };
      }),
      memberStats,
    });
  } catch (error) {
    console.error("Error fetching attendance frequency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
