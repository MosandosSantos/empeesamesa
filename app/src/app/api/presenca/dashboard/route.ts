import { NextRequest, NextResponse } from "next/server";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { isLojaAdmin, isSecretaria } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const { payload, error } = await verifyAuth(req);
  if (error) {
    return error;
  }

  const user = await getUserFromPayload(payload!);
  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role);
  if (needsLojaRestriction && !user.lojaId) {
    return NextResponse.json({ error: "Usuario sem loja vinculada" }, { status: 403 });
  }

  try {
    const searchParams = new URL(req.url).searchParams;
    const rawMonth = Number(searchParams.get("month"));
    const rawYear = Number(searchParams.get("year"));
    const now = new Date();
    const month = Number.isNaN(rawMonth) || rawMonth < 1 || rawMonth > 12 ? now.getMonth() + 1 : rawMonth;
    const year = Number.isNaN(rawYear) ? now.getFullYear() : rawYear;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const meetingFilter: any = {
      tenantId: payload!.tenantId,
      dataSessao: {
        gte: monthStart,
        lte: monthEnd,
      },
    };

    if (needsLojaRestriction) {
      meetingFilter.lojaId = user.lojaId;
    }

    const attendanceGroup = await prisma.attendance.groupBy({
      by: ["status"],
      where: {
        tenantId: payload!.tenantId,
        meeting: meetingFilter,
      },
      _count: {
        status: true,
      },
    });

    const counts = attendanceGroup.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    const presentes = counts["PRESENTE"] ?? 0;
    const faltas = (counts["FALTA"] ?? 0) + (counts["JUSTIFICADA"] ?? 0);

    const monthLabel = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(monthStart);

    return NextResponse.json({
      monthLabel,
      presentes,
      faltas,
      details: {
        faltas,
        justificadas: counts["JUSTIFICADA"] ?? 0,
        presentes,
      },
      scope: needsLojaRestriction ? "loja" : "tenant",
    });
  } catch (err) {
    console.error("Erro ao agregar presencas do dashboard:", err);
    return NextResponse.json(
      { error: "Erro ao carregar dados de presenca" },
      { status: 500 }
    );
  }
}
