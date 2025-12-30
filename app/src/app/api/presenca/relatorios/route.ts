import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

// GET /api/presenca/relatorios - Attendance reports
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo"); // "por-periodo" | "por-membro" | "ranking"
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const memberId = searchParams.get("memberId");

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo de relatório é obrigatório (por-periodo, por-membro, ranking)" },
        { status: 400 }
      );
    }

    // Build date filter for meetings
    const meetingDateFilter: any = {};
    if (dataInicio || dataFim) {
      meetingDateFilter.dataSessao = {};
      if (dataInicio) {
        meetingDateFilter.dataSessao.gte = new Date(dataInicio);
      }
      if (dataFim) {
        meetingDateFilter.dataSessao.lte = new Date(dataFim);
      }
    }

    if (tipo === "por-periodo") {
      // Presença por período - Resumo geral
      const meetings = await prisma.meeting.findMany({
        where: {
          tenantId: auth.tenantId,
          ...meetingDateFilter,
        },
        include: {
          attendances: true,
        },
        orderBy: {
          dataSessao: "desc",
        },
      });

      const resumo = meetings.map((meeting) => {
        const total = meeting.attendances.length;
        const presentes = meeting.attendances.filter((a) => a.status === "PRESENTE").length;
        const faltas = meeting.attendances.filter((a) => a.status === "FALTA").length;
        const justificadas = meeting.attendances.filter((a) => a.status === "JUSTIFICADA").length;

        return {
          meetingId: meeting.id,
          dataSessao: meeting.dataSessao,
          tipo: meeting.tipo,
          titulo: meeting.titulo,
          total,
          presentes,
          faltas,
          justificadas,
          percentualPresenca: total > 0 ? Math.round((presentes / total) * 100) : 0,
        };
      });

      return NextResponse.json({ resumo });
    }

    if (tipo === "por-membro") {
      // Presença por membro específico ou todos
      const where: any = {
        tenantId: auth.tenantId,
      };

      if (memberId) {
        where.memberId = memberId;
      }

      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              nomeCompleto: true,
              class: true,
            },
          },
          meeting: {
            where: {
              tenantId: auth.tenantId,
              ...meetingDateFilter,
            },
            select: {
              id: true,
              dataSessao: true,
              tipo: true,
              titulo: true,
            },
          },
        },
        orderBy: [
          {
            member: {
              nomeCompleto: "asc",
            },
          },
          {
            meeting: {
              dataSessao: "desc",
            },
          },
        ],
      });

      // Filter out attendances where meeting doesn't match date filter
      const filteredAttendances = attendances.filter((att) => att.meeting !== null);

      // Group by member
      const porMembro = filteredAttendances.reduce((acc: any, att) => {
        const memberId = att.member.id;
        if (!acc[memberId]) {
          acc[memberId] = {
            member: att.member,
            total: 0,
            presentes: 0,
            faltas: 0,
            justificadas: 0,
            detalhes: [],
          };
        }

        acc[memberId].total++;
        if (att.status === "PRESENTE") acc[memberId].presentes++;
        if (att.status === "FALTA") acc[memberId].faltas++;
        if (att.status === "JUSTIFICADA") acc[memberId].justificadas++;

        acc[memberId].detalhes.push({
          meetingId: att.meeting.id,
          dataSessao: att.meeting.dataSessao,
          tipo: att.meeting.tipo,
          titulo: att.meeting.titulo,
          status: att.status,
          observacoes: att.observacoes,
        });

        return acc;
      }, {});

      const resultado = Object.values(porMembro).map((item: any) => ({
        ...item,
        percentualPresenca: item.total > 0 ? Math.round((item.presentes / item.total) * 100) : 0,
      }));

      return NextResponse.json({ porMembro: resultado });
    }

    if (tipo === "ranking") {
      // Ranking de assiduidade
      const members = await prisma.member.findMany({
        where: {
          tenantId: auth.tenantId,
          situacao: "ATIVO", // Only active members
        },
        select: {
          id: true,
          nomeCompleto: true,
          class: true,
        },
      });

      const ranking = await Promise.all(
        members.map(async (member) => {
          const attendances = await prisma.attendance.findMany({
            where: {
              memberId: member.id,
              tenantId: auth.tenantId,
              meeting: {
                tenantId: auth.tenantId,
                ...meetingDateFilter,
              },
            },
          });

          const total = attendances.length;
          const presentes = attendances.filter((a) => a.status === "PRESENTE").length;
          const faltas = attendances.filter((a) => a.status === "FALTA").length;
          const justificadas = attendances.filter((a) => a.status === "JUSTIFICADA").length;

          return {
            member,
            total,
            presentes,
            faltas,
            justificadas,
            percentualPresenca: total > 0 ? Math.round((presentes / total) * 100) : 0,
          };
        })
      );

      // Sort by attendance percentage (descending)
      ranking.sort((a, b) => b.percentualPresenca - a.percentualPresenca);

      return NextResponse.json({ ranking });
    }

    return NextResponse.json(
      { error: "Tipo de relatório inválido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
