/**
 * Script para limpar dados do banco mantendo apenas estrutura de login
 * Mantém: Tenant padrão, usuário admin, 1 potência, 1 rito
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Iniciando limpeza do banco de dados...\n");

  try {
    // 1. Deletar dados em ordem (respeitar foreign keys)
    console.log("📦 Limpando tabelas...");

    await prisma.paymentAuditLog.deleteMany({});
    console.log("  ✓ PaymentAuditLog limpo");

    await prisma.kpiSnapshot.deleteMany({});
    console.log("  ✓ KpiSnapshot limpo");

    await prisma.duesCharge.deleteMany({});
    console.log("  ✓ DuesCharge limpo");

    await prisma.payment.deleteMany({});
    console.log("  ✓ Payment limpo");

    await prisma.attendance.deleteMany({});
    console.log("  ✓ Attendance limpo");

    await prisma.meeting.deleteMany({});
    console.log("  ✓ Meeting limpo");

    await prisma.inventoryMovement.deleteMany({});
    console.log("  ✓ InventoryMovement limpo");

    await prisma.inventoryItem.deleteMany({});
    console.log("  ✓ InventoryItem limpo");

    await prisma.paymentStatus.deleteMany({});
    console.log("  ✓ PaymentStatus limpo");

    await prisma.paymentPeriod.deleteMany({});
    console.log("  ✓ PaymentPeriod limpo");

    await prisma.memberPayment.deleteMany({});
    console.log("  ✓ MemberPayment limpo");

    await prisma.lancamento.deleteMany({});
    console.log("  ✓ Lancamento limpo");

    await prisma.categoria.deleteMany({});
    console.log("  ✓ Categoria limpo");

    await prisma.member.deleteMany({});
    console.log("  ✓ Member limpo");

    // Deletar usuários que NÃO são admin
    await prisma.user.deleteMany({
      where: {
        email: {
          not: "admin@lojamaconica.com.br",
        },
      },
    });
    console.log("  ✓ Users extras removidos");

    await prisma.loja.deleteMany({});
    console.log("  ✓ Loja limpo");

    // NÃO deletar Ritos e Potências - são dados de referência
    console.log("  ℹ Ritos mantidos (dados de referência)");
    console.log("  ℹ Potências mantidas (dados de referência)");

    // Deletar tenants que não são o padrão
    const adminUser = await prisma.user.findFirst({
      where: { email: "admin@lojamaconica.com.br" },
      select: { tenantId: true },
    });

    if (adminUser) {
      await prisma.tenant.deleteMany({
        where: {
          id: {
            not: adminUser.tenantId,
          },
        },
      });
      console.log("  ✓ Tenants extras removidos");
    }

    console.log("\n✅ Limpeza concluída!");
    console.log("\n📊 Estado final do banco:");

    // Mostrar o que sobrou
    const stats = {
      tenants: await prisma.tenant.count(),
      users: await prisma.user.count(),
      potencias: await prisma.potencia.count(),
      ritos: await prisma.rito.count(),
      lojas: await prisma.loja.count(),
      members: await prisma.member.count(),
    };

    console.log(`  - Tenants: ${stats.tenants}`);
    console.log(`  - Users: ${stats.users}`);
    console.log(`  - Potências: ${stats.potencias} (mantidas)`);
    console.log(`  - Ritos: ${stats.ritos} (mantidos)`);
    console.log(`  - Lojas: ${stats.lojas}`);
    console.log(`  - Membros: ${stats.members}`);

    const adminUserFinal = await prisma.user.findFirst({
      where: { email: "admin@lojamaconica.com.br" },
      select: {
        email: true,
        role: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    });

    if (adminUserFinal) {
      console.log("\n🔐 Credenciais de login mantidas:");
      console.log(`  Email: ${adminUserFinal.email}`);
      console.log(`  Senha: admin123`);
      console.log(`  Role: ${adminUserFinal.role}`);
      console.log(`  Tenant: ${adminUserFinal.tenant.name}`);
    }

    console.log("\n✨ Banco pronto para trabalhar!");
  } catch (error) {
    console.error("❌ Erro ao limpar banco:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
