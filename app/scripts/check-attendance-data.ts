import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

async function main() {
  console.log("Verificando dados de presença...\n");

  // Contar sessões
  const totalMeetings = await prisma.meeting.count();
  console.log(`📅 Total de sessões: ${totalMeetings}`);

  // Contar membros ativos
  const totalMembers = await prisma.member.count({
    where: { situacao: "ATIVO" },
  });
  console.log(`👥 Total de membros ativos: ${totalMembers}`);

  // Contar total de presenças
  const totalAttendances = await prisma.attendance.count();
  console.log(`✓ Total de registros de presença: ${totalAttendances}\n`);

  // Buscar sessões que já aconteceram (data <= hoje)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastMeetings = await prisma.meeting.findMany({
    where: {
      dataSessao: {
        lte: today,
      },
    },
    orderBy: {
      dataSessao: "desc",
    },
    take: 5,
    select: {
      id: true,
      dataSessao: true,
      tipo: true,
      titulo: true,
      _count: {
        select: {
          attendances: true,
        },
      },
    },
  });

  console.log("📊 Últimas 5 sessões que já aconteceram:");
  console.log("=".repeat(80));

  for (const meeting of pastMeetings) {
    const expectedAttendances = totalMembers;
    const actualAttendances = meeting._count.attendances;
    const missing = expectedAttendances - actualAttendances;
    const status = missing === 0 ? "✅" : "⚠️";

    console.log(
      `${status} ${new Date(meeting.dataSessao).toLocaleDateString("pt-BR")} - ${meeting.tipo}`
    );
    console.log(`   ID: ${meeting.id}`);
    console.log(`   Título: ${meeting.titulo || "Sem título"}`);
    console.log(
      `   Presenças: ${actualAttendances}/${expectedAttendances} (${missing} faltando)`
    );

    if (missing > 0) {
      // Buscar detalhes dos status
      const attendances = await prisma.attendance.findMany({
        where: { meetingId: meeting.id },
        select: { status: true },
      });

      const statusCount = attendances.reduce((acc: any, att) => {
        acc[att.status] = (acc[att.status] || 0) + 1;
        return acc;
      }, {});

      console.log(`   Status: PRESENTE=${statusCount.PRESENTE || 0}, FALTA=${statusCount.FALTA || 0}, JUSTIFICADA=${statusCount.JUSTIFICADA || 0}`);
    }

    console.log();
  }

  // Verificar se há membros sem presença em alguma sessão passada
  if (pastMeetings.length > 0) {
    const firstMeeting = pastMeetings[0];
    const attendances = await prisma.attendance.findMany({
      where: { meetingId: firstMeeting.id },
      select: { memberId: true },
    });

    const memberIds = await prisma.member.findMany({
      where: { situacao: "ATIVO" },
      select: { id: true, nomeCompleto: true },
    });

    const attendanceMemberIds = new Set(attendances.map((a) => a.memberId));
    const missingMembers = memberIds.filter(
      (m) => !attendanceMemberIds.has(m.id)
    );

    if (missingMembers.length > 0) {
      console.log(`\n⚠️  Membros SEM presença na última sessão:`);
      missingMembers.forEach((m) => {
        console.log(`   - ${m.nomeCompleto}`);
      });
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
