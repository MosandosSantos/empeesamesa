import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

async function main() {
  console.log("Starting database seed...");

  // Clean existing data (for development)
  await prisma.paymentAuditLog.deleteMany();
  await prisma.paymentStatus.deleteMany();
  await prisma.paymentPeriod.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.memberPayment.deleteMany();
  await prisma.lancamento.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.loja.deleteMany();
  await prisma.rito.deleteMany();
  await prisma.potencia.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("Cleaned existing data");

  // Create default tenant
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: "Loja Padrao - RER",
    },
  });

  console.log(`Created default tenant: ${defaultTenant.name}`);

  // Create admin user
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  const adminUser = await prisma.user.create({
    data: {
      tenantId: defaultTenant.id,
      email: "admin@lojamaconica.com.br",
      passwordHash: adminPasswordHash,
      role: "SYS_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);
  console.log("  Password: admin123");
  console.log("  Role: SYS_ADMIN");

  const memberPasswordHash = await bcrypt.hash("member123", 10);
  const memberUser = await prisma.user.create({
    data: {
      tenantId: defaultTenant.id,
      email: "member@lojamaconica.com.br",
      passwordHash: memberPasswordHash,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });

  console.log(`Created member user: ${memberUser.email}`);
  console.log("  Password: member123");
  console.log("  Role: MEMBER");

  // Create Potencias from DOCS/Potencias.xlsx
  const potenciasSeed = [
    { sigla: "GLMERJ", nome: "Grande Loja Maçonica do Rio de Janeiro" },
    { sigla: "GOB", nome: "Grande Oriente de Brasil" },
    { sigla: "GORJ", nome: "Grande Oriente do Rio de Janeiro" },
    { sigla: "PreSS", nome: "Prefeitura de São Sebaistião" },
    { sigla: "GPHBR", nome: "Grande Priorato Hermético do Brasil" },
  ];

  const potencias = await Promise.all(
    potenciasSeed.map((potencia) =>
      prisma.potencia.create({
        data: {
          tenantId: defaultTenant.id,
          nome: potencia.nome,
          sigla: potencia.sigla,
        },
      })
    )
  );

  const potenciaMap = new Map(potencias.map((potencia) => [potencia.sigla ?? "", potencia]));
  const potenciaPadrao = potenciaMap.get("GLMERJ") ?? potencias[0];
  const potenciaAlternativa = potenciaMap.get("GOB") ?? potenciaPadrao;

  console.log(`Created potencias: ${potencias.length}`);

  // Create Rito (Rite)
  const ritoRER = await prisma.rito.create({
    data: {
      tenantId: defaultTenant.id,
      nome: "Rito Escoces Retificado",
      sigla: "RER",
      descricao: "Rito de origem francesa com forte influencia cavalheiresca",
    },
  });

  const ritoREAA = await prisma.rito.create({
    data: {
      tenantId: defaultTenant.id,
      nome: "Rito Escoces Antigo e Aceito",
      sigla: "REAA",
      descricao: "Rito masonico mais difundido no mundo",
    },
  });

  console.log(`Created ritos: ${ritoRER.sigla}, ${ritoREAA.sigla}`);

  // Create Loja (Lodge)
  const lojaPadrao = await prisma.loja.create({
    data: {
      tenantId: defaultTenant.id,
      potenciaId: potenciaPadrao.id,
      ritoId: ritoRER.id,
      lojaMX: "Cavaleiros da Luz e da Virtude",
      numero: 1,
      contatoNome: "Maria Andrade",
      contractNumber: "SAAS-2025-0001",
      mensalidadeAtiva: true,
      mensalidadeValidaAte: new Date("2025-12-31"),
      cnpj: "12345678000190",
      email: "secretaria@loja001.org.br",
      telefone: "+5521987654321",
      website: "https://loja001.org.br",
      enderecoLogradouro: "Rua Masonica",
      enderecoNumero: "777",
      enderecoBairro: "Centro",
      enderecoCidade: "Rio de Janeiro",
      enderecoUf: "RJ",
      enderecoCep: "20010-000",
      dataFundacao: new Date("1950-03-21"),
      situacao: "ATIVA",
      observacoes: "Loja fundadora do sistema",
    },
  });

  console.log(`Created loja: ${lojaPadrao.lojaMX} #${lojaPadrao.numero}`);

  // Another tenant and lodge to showcase SaaS isolation
  const tenantAurora = await prisma.tenant.create({
    data: {
      name: "Loja Aurora - REAA",
    },
  });

  const lojaAurora = await prisma.loja.create({
    data: {
      tenantId: tenantAurora.id,
      potenciaId: potenciaAlternativa.id,
      ritoId: ritoREAA.id,
      lojaMX: "Aurora do Oriente",
      numero: 22,
      contatoNome: "Carlos Mendes",
      contractNumber: "SAAS-2025-0022",
      mensalidadeAtiva: false,
      mensalidadeValidaAte: new Date("2024-12-31"),
      situacao: "ADORMECIDA",
      enderecoCidade: "Curitiba",
      enderecoUf: "PR",
    },
  });

  console.log(`Created loja: ${lojaAurora.lojaMX} #${lojaAurora.numero} (inactive billing)`);

  const auroraAdminPasswordHash = await bcrypt.hash("admin123", 10);
  const auroraAdmin = await prisma.user.create({
    data: {
      tenantId: tenantAurora.id,
      email: "admin@aurora.com.br",
      passwordHash: auroraAdminPasswordHash,
      role: "ADMIN",
    },
  });

  console.log(`Created admin user for tenant Aurora: ${auroraAdmin.email}`);

  // Create sample member
  const sampleMember = await prisma.member.create({
    data: {
      tenantId: defaultTenant.id,

      // Loja atual
      lojaId: lojaPadrao.id,
      lojaAtualNome: lojaPadrao.lojaMX,
      lojaAtualNumero: lojaPadrao.numero?.toString(),

      // Dados do cadastro
      dataAdmissao: new Date("2020-01-15"),
      tipoAdmissao: "INIC",
      numeroFiliado: "2020001",

      // Dados pessoais
      nomeCompleto: "Joao da Silva Santos",
      dataNascimento: new Date("1980-05-20"),
      pai: "Jose Santos",
      mae: "Maria Silva Santos",
      naturalCidade: "Sao Paulo",
      naturalUf: "SP",
      nacionalidade: "Brasileira",
      estadoCivil: "CASADO",

      // Documentos
      identidadeNumero: "12.345.678-9",
      orgaoEmissor: "SSP-SP",
      dataEmissao: new Date("2010-03-10"),
      cpf: "12345678901",

      // Contatos
      email: "joao.silva@example.com",
      celular: "+5511987654321",
      telefoneUrgencia: "+5511912345678",

      // Endereco
      enderecoLogradouro: "Rua das Flores, 123",
      enderecoCep: "01234-567",
      enderecoBairro: "Centro",
      enderecoCidade: "Sao Paulo",
      enderecoUf: "SP",

      // Escolaridade
      escolaridade: "TERCEIRO_GRAU",

      // Marcos rituais
      dataIniciacao: new Date("2020-01-15"),
      lojaIniciacaoNome: "Loja Padrao",
      lojaIniciacaoNumero: "001",
      potenciaIniciacaoId: defaultTenant.id,

      // Status
      situacao: "ATIVO",
    },
  });

  console.log(`Created sample member: ${sampleMember.nomeCompleto}`);

  // Create more sample members for payment testing
  const member2 = await prisma.member.create({
    data: {
      tenantId: defaultTenant.id,
      lojaId: lojaPadrao.id,
      lojaAtualNome: lojaPadrao.lojaMX,
      lojaAtualNumero: lojaPadrao.numero?.toString(),
      dataAdmissao: new Date("2021-03-10"),
      tipoAdmissao: "INIC",
      numeroFiliado: "2021002",
      nomeCompleto: "Pedro Oliveira Costa",
      dataNascimento: new Date("1975-08-15"),
      pai: "Antonio Costa",
      mae: "Helena Oliveira",
      naturalCidade: "Rio de Janeiro",
      naturalUf: "RJ",
      nacionalidade: "Brasileira",
      estadoCivil: "SOLTEIRO",
      identidadeNumero: "23.456.789-0",
      orgaoEmissor: "SSP-RJ",
      dataEmissao: new Date("2012-05-10"),
      cpf: "23456789012",
      email: "pedro.costa@example.com",
      celular: "+5521987654321",
      telefoneUrgencia: "+5521912345678",
      enderecoLogradouro: "Av. Atlantica, 456",
      enderecoCep: "22021-000",
      enderecoBairro: "Copacabana",
      enderecoCidade: "Rio de Janeiro",
      enderecoUf: "RJ",
      escolaridade: "POS_GRADUACAO",
      dataIniciacao: new Date("2021-03-10"),
      lojaIniciacaoNome: lojaPadrao.lojaMX,
      lojaIniciacaoNumero: lojaPadrao.numero?.toString(),
      potenciaIniciacaoId: defaultTenant.id,
      situacao: "ATIVO",
    },
  });

  const member3 = await prisma.member.create({
    data: {
      tenantId: defaultTenant.id,
      lojaId: lojaPadrao.id,
      lojaAtualNome: lojaPadrao.lojaMX,
      lojaAtualNumero: lojaPadrao.numero?.toString(),
      dataAdmissao: new Date("2022-06-20"),
      tipoAdmissao: "FILI",
      numeroFiliado: "2022003",
      nomeCompleto: "Carlos Alberto Mendes",
      dataNascimento: new Date("1985-11-30"),
      pai: "Roberto Mendes",
      mae: "Ana Paula Mendes",
      naturalCidade: "Belo Horizonte",
      naturalUf: "MG",
      nacionalidade: "Brasileira",
      estadoCivil: "CASADO",
      identidadeNumero: "34.567.890-1",
      orgaoEmissor: "SSP-MG",
      dataEmissao: new Date("2015-02-15"),
      cpf: "34567890123",
      email: "carlos.mendes@example.com",
      celular: "+5531987654321",
      telefoneUrgencia: "+5531912345678",
      enderecoLogradouro: "Rua da Paz, 789",
      enderecoCep: "30130-000",
      enderecoBairro: "Centro",
      enderecoCidade: "Belo Horizonte",
      enderecoUf: "MG",
      escolaridade: "MESTRADO",
      dataIniciacao: new Date("2019-08-05"),
      lojaIniciacaoNome: "Estrela do Sul",
      lojaIniciacaoNumero: "45",
      potenciaIniciacaoId: defaultTenant.id,
      situacao: "ATIVO",
    },
  });

  console.log(`Created additional members: ${member2.nomeCompleto}, ${member3.nomeCompleto}`);

  // Create default categories (Sprint 6)
  const defaultCategories = [
    "Mensalidades",
    "Doacoes",
    "Aluguel",
    "Suprimentos",
    "Eventos",
    "Manutencao",
  ];

  const createdCategories = await Promise.all(
    defaultCategories.map((nome) =>
      prisma.categoria.create({
        data: {
          tenantId: defaultTenant.id,
          nome,
        },
      })
    )
  );

  console.log(`Created ${createdCategories.length} default categories`);

  // Create some sample lancamentos (financial entries)
  const categoriaMensalidades = createdCategories.find((c) => c.nome === "Mensalidades");
  const categoriaAluguel = createdCategories.find((c) => c.nome === "Aluguel");

  if (categoriaMensalidades) {
    await prisma.lancamento.create({
      data: {
        tenantId: defaultTenant.id,
        tipo: "RECEITA",
        categoriaId: categoriaMensalidades.id,
        descricao: "Mensalidades dezembro/2025",
        valorPrevisto: 5000,
        valorPago: 3500,
        dataVencimento: new Date("2025-12-31"),
        dataPagamento: new Date("2025-12-15"),
        status: "PARCIAL",
        formaPagamento: "PIX",
      },
    });
  }

  if (categoriaAluguel) {
    await prisma.lancamento.create({
      data: {
        tenantId: defaultTenant.id,
        tipo: "DESPESA",
        categoriaId: categoriaAluguel.id,
        descricao: "Aluguel do templo - Janeiro/2026",
        valorPrevisto: 2500,
        valorPago: 0,
        dataVencimento: new Date("2026-01-10"),
        status: "ABERTO",
      },
    });
  }

  console.log("Created sample lancamentos");

  const inventoryItem = await prisma.inventoryItem.create({
    data: {
      tenantId: defaultTenant.id,
      sku: "AV-001",
      name: "Avental Ritualistico",
      unit: "un",
      category: "Paramentos",
      location: "Sala de paramentos",
      minQty: 5,
      reorderPoint: 8,
      qtyOnHand: 10,
      avgCost: 5,
      lastPurchaseCost: 5,
      createdById: adminUser.id,
      createdByName: adminUser.email,
      updatedById: adminUser.id,
      updatedByName: adminUser.email,
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      tenantId: defaultTenant.id,
      itemId: inventoryItem.id,
      type: "IN",
      qty: 10,
      unitCost: 5,
      movementValue: 50,
      qtyBefore: 0,
      qtyAfter: 10,
      avgCostBefore: 0,
      avgCostAfter: 5,
      reason: "Saldo inicial",
      createdById: adminUser.id,
      createdByName: adminUser.email,
    },
  });

  // Create payment periods (mensalidades do ano corrente)
  const currentYear = 2025;
  const monthlyPeriods = await Promise.all(
    Array.from({ length: 12 }, (_, i) => i + 1).map((month) =>
      prisma.paymentPeriod.create({
        data: {
          tenantId: defaultTenant.id,
          type: "MONTHLY",
          year: currentYear,
          month,
          label: `Mensalidade ${new Date(currentYear, month - 1).toLocaleDateString("pt-BR", { month: "short" })}/${currentYear}`,
        },
      })
    )
  );

  console.log(`Created ${monthlyPeriods.length} monthly payment periods for ${currentYear}`);

  // Create annual payment periods (próximos 6 anos)
  const annualPeriods = await Promise.all(
    Array.from({ length: 6 }, (_, i) => currentYear + i).map((year) =>
      prisma.paymentPeriod.create({
        data: {
          tenantId: defaultTenant.id,
          type: "ANNUAL",
          year,
          label: `Anuidade ${year}`,
        },
      })
    )
  );

  console.log(`Created ${annualPeriods.length} annual payment periods`);

  // Create some payment statuses for sample members
  const allMembers = [sampleMember, member2, member3];

  // Marcar alguns meses como pagos para o primeiro membro
  for (let i = 0; i < 3; i++) {
    await prisma.paymentStatus.create({
      data: {
        tenantId: defaultTenant.id,
        memberId: sampleMember.id,
        periodId: monthlyPeriods[i].id,
        status: "PAID",
        amount: 95.0,
        method: "PIX",
        paidAt: new Date(currentYear, i, 15),
        notes: "Pagamento em dia",
      },
    });
  }

  // Marcar alguns meses como pagos para o segundo membro
  for (let i = 0; i < 2; i++) {
    await prisma.paymentStatus.create({
      data: {
        tenantId: defaultTenant.id,
        memberId: member2.id,
        periodId: monthlyPeriods[i].id,
        status: "PAID",
        amount: 95.0,
        method: "TRANSFERENCIA",
        paidAt: new Date(currentYear, i, 20),
      },
    });
  }

  // Marcar anuidade 2025 como paga para o primeiro membro
  await prisma.paymentStatus.create({
    data: {
      tenantId: defaultTenant.id,
      memberId: sampleMember.id,
      periodId: annualPeriods[0].id,
      status: "PAID",
      amount: 350.0,
      method: "PIX",
      paidAt: new Date(currentYear, 0, 10),
      notes: "Anuidade 2025 paga antecipadamente",
    },
  });

  console.log("Created sample payment statuses");

  console.log("\nDatabase seeded successfully!");
  console.log("\nSummary:");
  console.log(`   - Tenants: 2`);
  console.log(`   - Potencias: ${potencias.length}`);
  console.log(`   - Ritos: 2`);
  console.log(`   - Lojas: 2`);
  console.log(`   - Users: 3 (1 admin + 2 members)`);
  console.log(`   - Members: 3`);
  console.log(`   - Categorias: ${createdCategories.length}`);
  console.log(`   - Lancamentos: 2`);
  console.log(`   - Payment Periods: ${monthlyPeriods.length + annualPeriods.length} (12 monthly + 6 annual)`);
  console.log(`   - Payment Statuses: 6 (sample payments)`);
  console.log("\nAdmin credentials:");
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Password: admin123`);
  console.log("\nLodge details:");
  console.log(`   Name: ${lojaPadrao.lojaMX}`);
  console.log(`   Number: ${lojaPadrao.numero}`);
  console.log(`   Rite: ${ritoRER.sigla}`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
