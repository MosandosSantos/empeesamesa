import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

async function main() {
  console.log("Creating admin user for Loja Impeesa...");

  // Buscar a loja Impeesa
  const lojaImpeesa = await prisma.loja.findFirst({
    where: {
      OR: [
        { lojaMX: { contains: "Impeesa", mode: "insensitive" } },
        { lojaMX: { contains: "Impésa", mode: "insensitive" } },
      ],
    },
  });

  if (!lojaImpeesa) {
    console.error("❌ Loja Impeesa não encontrada!");
    console.log("\nLojas disponíveis:");
    const lojas = await prisma.loja.findMany({
      select: { id: true, lojaMX: true, numero: true },
    });
    lojas.forEach((loja) => {
      console.log(`  - ${loja.lojaMX} Nº ${loja.numero || "N/A"} (ID: ${loja.id})`);
    });
    process.exit(1);
  }

  console.log(`✅ Encontrada loja: ${lojaImpeesa.lojaMX} Nº ${lojaImpeesa.numero || "N/A"}`);

  // Pegar o tenant da loja
  const tenantId = lojaImpeesa.tenantId;

  // Verificar se já existe um usuário admin para essa loja
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: "admin@impeesa.com.br",
    },
  });

  if (existingAdmin) {
    console.log("\n⚠️  Usuário admin@impeesa.com.br já existe!");
    console.log("Atualizando senha para: impeesa123");

    const newPasswordHash = await bcrypt.hash("impeesa123", 10);

    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash: newPasswordHash,
        role: "ADMIN",
      },
    });

    console.log("\n✅ Senha atualizada com sucesso!");
  } else {
    // Criar novo usuário admin
    const passwordHash = await bcrypt.hash("impeesa123", 10);

    const adminUser = await prisma.user.create({
      data: {
        tenantId: tenantId,
        email: "admin@impeesa.com.br",
        passwordHash: passwordHash,
        role: "ADMIN",
      },
    });

    console.log("\n✅ Usuário admin criado com sucesso!");
    console.log(`   ID: ${adminUser.id}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🔑 CREDENCIAIS DE ACESSO - LOJA IMPEESA");
  console.log("=".repeat(60));
  console.log("Email:    admin@impeesa.com.br");
  console.log("Senha:    impeesa123");
  console.log("Role:     ADMIN");
  console.log("Loja:     " + lojaImpeesa.lojaMX + " Nº " + (lojaImpeesa.numero || "N/A"));
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
