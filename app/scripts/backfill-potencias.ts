import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const potencia = await prisma.potencia.findFirst({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  if (!potencia) {
    throw new Error("Nenhuma potencia encontrada. Crie potencias antes de executar o backfill.");
  }

  const result = await prisma.$executeRaw`
    UPDATE "loja"
    SET "potenciaId" = ${potencia.id}
    WHERE "potenciaId" IS NULL
  `;

  console.log(`Backfill concluido. Potencia padrao: ${potencia.nome}.`);
  console.log(`Registros atualizados: ${result}`);
}

main()
  .catch((e) => {
    console.error("Erro no backfill de potencias:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
