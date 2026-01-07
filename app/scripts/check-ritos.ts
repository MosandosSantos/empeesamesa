import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando ritos no banco...\n");

  const ritos = await prisma.rito.findMany({
    select: {
      id: true,
      tenantId: true,
      nome: true,
      sigla: true,
    },
  });

  console.log(`Total de ritos encontrados: ${ritos.length}\n`);

  if (ritos.length === 0) {
    console.log("❌ Nenhum rito encontrado no banco!");
    console.log("\nCriando ritos de exemplo...\n");

    // Buscar o primeiro tenant
    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
      console.log("❌ Nenhum tenant encontrado! Execute o seed primeiro.");
      return;
    }

    console.log(`✓ Tenant encontrado: ${tenant.name} (${tenant.id})\n`);

    // Criar ritos de exemplo
    const ritosData = [
      { nome: "Rito Escocês Retificado", sigla: "RER" },
      { nome: "Rito Escocês Antigo e Aceito", sigla: "REAA" },
      { nome: "Rito de York", sigla: "York" },
      { nome: "Rito Brasileiro", sigla: "RB" },
    ];

    for (const data of ritosData) {
      const rito = await prisma.rito.create({
        data: {
          ...data,
          tenantId: tenant.id,
        },
      });
      console.log(`✓ Criado: ${rito.sigla} - ${rito.nome}`);
    }

    console.log("\n✅ Ritos criados com sucesso!");
  } else {
    console.log("Ritos encontrados:");
    ritos.forEach((r) => {
      console.log(`  - ${r.sigla ? `${r.sigla} - ` : ""}${r.nome} (tenant: ${r.tenantId})`);
    });
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
