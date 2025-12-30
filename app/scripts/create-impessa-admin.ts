import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

async function main() {
  console.log("Verificando Loja Impessa...\n");

  // Buscar a loja Impessa/Impeesa
  const lojaImpessa = await prisma.loja.findFirst({
    where: {
      OR: [
        { lojaMX: { contains: "Impessa", mode: "insensitive" } },
        { lojaMX: { contains: "Impeesa", mode: "insensitive" } },
        { lojaMX: { contains: "Impeza", mode: "insensitive" } },
      ],
    },
    include: {
      tenant: true,
      potencia: true,
      rito: true,
    },
  });

  if (!lojaImpessa) {
    console.log("❌ Loja Impessa não encontrada no banco de dados.");
    console.log("\nLojas disponíveis:");

    const todasLojas = await prisma.loja.findMany({
      include: {
        tenant: true,
      },
    });

    todasLojas.forEach((loja) => {
      console.log(`  - ${loja.lojaMX} (Tenant: ${loja.tenant.name})`);
    });

    console.log("\nPor favor, execute o seed ou crie a Loja Impessa primeiro.");
    return;
  }

  console.log("✅ Loja encontrada:");
  console.log(`   Nome: ${lojaImpessa.lojaMX}`);
  console.log(`   Número: ${lojaImpessa.numero}`);
  console.log(`   Tenant: ${lojaImpessa.tenant.name}`);
  console.log(`   Potência: ${lojaImpessa.potencia.nome}`);
  if (lojaImpessa.rito) {
    console.log(`   Rito: ${lojaImpessa.rito.nome}`);
  }

  // Verificar se já existe um admin para esse tenant
  const existingAdmin = await prisma.user.findFirst({
    where: {
      tenantId: lojaImpessa.tenantId,
      role: { in: ["LODGE_ADMIN", "ADMIN"] },
    },
  });

  if (existingAdmin) {
    console.log(`\n⚠️  Já existe um administrador para este tenant:`);
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Role: ${existingAdmin.role}`);
    console.log("\nDeseja criar um novo administrador? Continuando...\n");
  }

  // Criar usuário administrador da loja
  const password = "impessa2025";
  const passwordHash = await bcrypt.hash(password, 10);

  const adminEmail = "admin@impessa.org.br";

  // Verificar se o email já existe
  const existingUser = await prisma.user.findFirst({
    where: {
      tenantId: lojaImpessa.tenantId,
      email: adminEmail,
    },
  });

  if (existingUser) {
    console.log(`❌ Usuário ${adminEmail} já existe!`);
    console.log(`   Role: ${existingUser.role}`);
    console.log("\nSe você esqueceu a senha, pode redefinir com o seguinte comando:");
    console.log(`   npm run db:studio`);
    console.log("\nCredenciais existentes:");
    console.log(`   Email: ${existingUser.email}`);
    console.log(`   Senha: (verificar com o administrador)`);
    return;
  }

  const adminUser = await prisma.user.create({
    data: {
      tenantId: lojaImpessa.tenantId,
      email: adminEmail,
      passwordHash,
      role: "LODGE_ADMIN", // Administrador apenas da loja, não do SaaS
    },
  });

  console.log("\n✅ Usuário administrador criado com sucesso!");
  console.log("\n═══════════════════════════════════════════");
  console.log("CREDENCIAIS DO ADMINISTRADOR DA LOJA IMPESSA");
  console.log("═══════════════════════════════════════════");
  console.log(`Email:    ${adminUser.email}`);
  console.log(`Senha:    ${password}`);
  console.log(`Role:     ${adminUser.role}`);
  console.log(`Tenant:   ${lojaImpessa.tenant.name}`);
  console.log(`Loja:     ${lojaImpessa.lojaMX}`);
  console.log("═══════════════════════════════════════════");
  console.log("\n⚠️  IMPORTANTE:");
  console.log("   - Este usuário tem acesso APENAS aos dados da Loja Impessa");
  console.log("   - Não tem acesso a outras lojas do sistema");
  console.log("   - Pode gerenciar membros, financeiro, inventário, etc.");
  console.log("   - NÃO pode criar ou editar outras lojas (apenas SAAS_ADMIN pode)");
  console.log("\n🔗 Acesse o sistema em: http://localhost:3000/login");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao criar administrador:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
