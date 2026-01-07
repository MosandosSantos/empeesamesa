import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando potências no banco...\n");

  const potencias = await prisma.potencia.findMany({
    select: {
      id: true,
      tenantId: true,
      nome: true,
      sigla: true,
    },
  });

  console.log(`Total de potências encontradas: ${potencias.length}\n`);

  if (potencias.length === 0) {
    console.log("❌ Nenhuma potência encontrada no banco!");
    console.log("\nCriando potências de exemplo...\n");

    // Buscar o primeiro tenant
    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
      console.log("❌ Nenhum tenant encontrado! Execute o seed primeiro.");
      return;
    }

    console.log(`✓ Tenant encontrado: ${tenant.name} (${tenant.id})\n`);

    // Criar potências de exemplo
    const potenciasData = [
      { nome: "Grande Oriente Independente de Santa Catarina", sigla: "GOISC" },
      { nome: "Grande Priorado Independente do Brasil", sigla: "GPIB" },
      { nome: "Grande Loja Maçônica de Santa Catarina", sigla: "GLMSC" },
    ];

    for (const data of potenciasData) {
      const potencia = await prisma.potencia.create({
        data: {
          ...data,
          tenantId: tenant.id,
        },
      });
      console.log(`✓ Criada: ${potencia.sigla} - ${potencia.nome}`);
    }

    console.log("\n✅ Potências criadas com sucesso!");
  } else {
    console.log("Potências encontradas:");
    potencias.forEach((p) => {
      console.log(`  - ${p.sigla ? `${p.sigla} - ` : ""}${p.nome} (tenant: ${p.tenantId})`);
    });
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
