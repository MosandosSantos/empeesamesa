import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ritos = ["REAA", "RER", "EM/YO", "BRAS", "YORK", "SCHO", "ADON", "SJO"];

function selectRitoAleatorio(): string {
  const rand = Math.random() * 100;

  // 50% REAA
  if (rand < 50) {
    return "REAA";
  }

  // 20% RER (50 a 70)
  if (rand < 70) {
    return "RER";
  }

  // 30% distribuído entre os outros 6 ritos
  const outrosRitos = ["EM/YO", "BRAS", "YORK", "SCHO", "ADON", "SJO"];
  const randomIndex = Math.floor(Math.random() * outrosRitos.length);
  return outrosRitos[randomIndex];
}

async function main() {
  console.log("🔄 Atualizando ritos dos membros...\n");

  // Buscar todos os membros
  const members = await prisma.member.findMany({
    select: { id: true, nomeCompleto: true },
  });

  console.log(`📊 Total de membros: ${members.length}\n`);

  const stats: Record<string, number> = {};

  // Atualizar cada membro com um rito aleatório
  for (const member of members) {
    const rito = selectRitoAleatorio();

    await prisma.member.update({
      where: { id: member.id },
      data: { rito },
    });

    // Contar estatísticas
    stats[rito] = (stats[rito] || 0) + 1;

    console.log(`✓ ${member.nomeCompleto.padEnd(40)} → ${rito}`);
  }

  console.log("\n📈 Estatísticas de distribuição:");
  console.log("─".repeat(50));

  const total = members.length;
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([rito, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      const bar = "█".repeat(Math.round((count / total) * 40));
      console.log(`${rito.padEnd(10)} ${count.toString().padStart(3)} (${percentage.padStart(5)}%) ${bar}`);
    });

  console.log("─".repeat(50));
  console.log(`Total: ${total} membros\n`);
  console.log("✅ Ritos atualizados com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
