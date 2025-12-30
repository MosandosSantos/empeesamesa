import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

async function main() {
  console.log("Corrigindo presenças faltantes...\n");

  // Buscar sessões que já aconteceram
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastMeetings = await prisma.meeting.findMany({
    where: {
      dataSessao: {
        lte: today,
      },
    },
    include: {
      attendances: {
        select: {
          memberId: true,
        },
      },
    },
  });

  console.log(`📅 Encontradas ${pastMeetings.length} sessões que já aconteceram\n`);

  for (const meeting of pastMeetings) {
    console.log(`Processando sessão: ${new Date(meeting.dataSessao).toLocaleDateString("pt-BR")} - ${meeting.tipo}`);

    // Buscar todos os membros ativos
    const allMembers = await prisma.member.findMany({
      where: {
        tenantId: meeting.tenantId,
        situacao: "ATIVO",
      },
      select: {
        id: true,
        nomeCompleto: true,
      },
    });

    // IDs dos membros que já têm presença
    const attendanceMemberIds = new Set(
      meeting.attendances.map((a) => a.memberId)
    );

    // Membros que não têm presença
    const missingMembers = allMembers.filter(
      (m) => !attendanceMemberIds.has(m.id)
    );

    console.log(`  Total de membros ativos: ${allMembers.length}`);
    console.log(`  Presenças já registradas: ${meeting.attendances.length}`);
    console.log(`  Presenças faltando: ${missingMembers.length}`);

    if (missingMembers.length > 0) {
      console.log(`  ➡️  Criando ${missingMembers.length} registros de FALTA...`);

      // Criar presenças com status FALTA para membros sem registro
      const results = await Promise.all(
        missingMembers.map((member) =>
          prisma.attendance.create({
            data: {
              tenantId: meeting.tenantId,
              meetingId: meeting.id,
              memberId: member.id,
              status: "FALTA",
              observacoes: null,
            },
          })
        )
      );

      console.log(`  ✅ ${results.length} registros de FALTA criados com sucesso!`);
    } else {
      console.log(`  ✅ Sessão já está completa!`);
    }

    console.log();
  }

  // Resumo final
  const totalAttendances = await prisma.attendance.count();
  console.log("=".repeat(60));
  console.log(`✅ Correção concluída!`);
  console.log(`📊 Total de registros de presença no banco: ${totalAttendances}`);
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
