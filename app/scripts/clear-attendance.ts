import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

async function main() {
  console.log("Limpando tabela de presença...");

  // Contar registros antes
  const countBefore = await prisma.attendance.count();
  console.log(`📊 Registros de presença encontrados: ${countBefore}`);

  if (countBefore === 0) {
    console.log("✅ Tabela já está vazia!");
    return;
  }

  // Deletar todos os registros de presença
  const result = await prisma.attendance.deleteMany({});

  console.log(`🗑️  ${result.count} registros de presença deletados com sucesso!`);
  console.log("✅ Tabela de presença limpa!");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
