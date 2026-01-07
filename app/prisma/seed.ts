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

  const saasAdminPasswordHash = await bcrypt.hash("teste2025", 10);
  const saasAdminUser = await prisma.user.create({
    data: {
      tenantId: defaultTenant.id,
      email: "mosansantos@salgoisc.com",
      passwordHash: saasAdminPasswordHash,
      role: "ADMIN_SAAS",
      status: "ACTIVE",
    },
  });

  console.log(`Created SaaS admin user: ${saasAdminUser.email}`);
  console.log("  Password: teste2025");
  console.log("  Role: ADMIN_SAAS");

  const potenciaAdminPasswordHash = await bcrypt.hash("teste2025", 10);
  const potenciaAdminUser = await prisma.user.create({
    data: {
      tenantId: defaultTenant.id,
      email: "oficialpotencia@salgoisc.com.br",
      passwordHash: potenciaAdminPasswordHash,
      role: "ADMIN_POT",
      status: "ACTIVE",
    },
  });

  console.log(`Created potencia admin user: ${potenciaAdminUser.email}`);
  console.log("  Password: teste2025");
  console.log("  Role: ADMIN_POT");

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
    {
      sigla: "GOISC",
      nome: "Grande Oriente Independente de Santa Catarina",
      enderecoCidade: "Florianopolis",
      enderecoUf: "SC",
      enderecoBairro: "Centro",
      enderecoLogradouro: "Rua Principal",
      enderecoNumero: "100",
      enderecoCep: "88000-000",
      email: "contato@goisc.org.br",
      telefone: "+554830000000",
      website: "https://goisc.org.br",
      observacoes: "Contato: Wilson",
    },
  ];

  const potencias = await Promise.all(
    potenciasSeed.map((potencia) =>
      prisma.potencia.create({
        data: {
          tenantId: defaultTenant.id,
          nome: potencia.nome,
          sigla: potencia.sigla,
          email: potencia.email,
          telefone: potencia.telefone,
          website: potencia.website,
          enderecoLogradouro: potencia.enderecoLogradouro,
          enderecoNumero: potencia.enderecoNumero,
          enderecoComplemento: potencia.enderecoComplemento,
          enderecoBairro: potencia.enderecoBairro,
          enderecoCidade: potencia.enderecoCidade,
          enderecoUf: potencia.enderecoUf,
          enderecoCep: potencia.enderecoCep,
          observacoes: potencia.observacoes,
        },
      })
    )
  );

  const potenciaMap = new Map(potencias.map((potencia) => [potencia.sigla ?? "", potencia]));
  const potenciaPadrao = potenciaMap.get("GLMERJ") ?? potencias[0];
  const potenciaAlternativa = potenciaMap.get("GOB") ?? potenciaPadrao;

  console.log(`Created potencias: ${potencias.length}`);

  // Create Ritos (Rites)
  const ritosSeed = [
    { sigla: "REAA", nome: "Rito Escocês Antigo e Aceito", descricao: "Rito maçônico mais difundido no mundo" },
    { sigla: "RER", nome: "Rito Escocês Retificado", descricao: "Rito de origem francesa com forte influência cavalheiresca" },
    { sigla: "MEM", nome: "Rito de Mênfis e Misraim", descricao: "Rito de origem egípcia" },
    { sigla: "ADO", nome: "Rito Adonhiramita", descricao: "Rito tradicional de origem francesa" },
    { sigla: "BRA", nome: "Rito Brasileiro", descricao: "Rito simbólico brasileiro" },
    { sigla: "EMU", nome: "Emulação", descricao: "Rito de emulação" },
    { sigla: "YRK", nome: "Rito de York", descricao: "Rito de origem inglesa" },
    { sigla: "SHR", nome: "Schroeder", descricao: "Rito de Schroeder" },
    { sigla: "RSJ", nome: "Rito de São João", descricao: "Rito simbólico tradicional" },
    { sigla: "RAD", nome: "Rito de Adoção", descricao: "Rito de adoção" },
    { sigla: "OUT", nome: "Outros", descricao: "Outros ritos" },
  ];

  const ritos = await Promise.all(
    ritosSeed.map((rito) =>
      prisma.rito.create({
        data: {
          tenantId: defaultTenant.id,
          nome: rito.nome,
          sigla: rito.sigla,
          descricao: rito.descricao,
        },
      })
    )
  );

  const ritoMap = new Map(ritos.map((rito) => [rito.sigla ?? "", rito]));
  const ritoRER = ritoMap.get("RER") ?? ritos[0];
  const ritoREAA = ritoMap.get("REAA") ?? ritos[0];

  console.log(`Created ritos: ${ritos.length}`);

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


  // Create sample members
  const membersSeed = [
    { nomeCompleto: "Joao Silva", class: "AP", dataNascimento: new Date("1971-02-11"), cpf: "00000000001", email: "joao.silva1@example.com", numeroFiliado: "2025001" },
    { nomeCompleto: "Pedro Souza", class: "AP", dataNascimento: new Date("1972-03-12"), cpf: "00000000002", email: "pedro.souza2@example.com", numeroFiliado: "2025002" },
    { nomeCompleto: "Carlos Oliveira", class: "AP", dataNascimento: new Date("1973-04-13"), cpf: "00000000003", email: "carlos.oliveira3@example.com", numeroFiliado: "2025003" },
    { nomeCompleto: "Lucas Ferreira", class: "AP", dataNascimento: new Date("1974-05-14"), cpf: "00000000004", email: "lucas.ferreira4@example.com", numeroFiliado: "2025004" },
    { nomeCompleto: "Rafael Almeida", class: "AP", dataNascimento: new Date("1975-06-15"), cpf: "00000000005", email: "rafael.almeida5@example.com", numeroFiliado: "2025005" },
    { nomeCompleto: "Bruno Santos", class: "AP", dataNascimento: new Date("1976-07-16"), cpf: "00000000006", email: "bruno.santos6@example.com", numeroFiliado: "2025006" },
    { nomeCompleto: "Marcelo Pereira", class: "AP", dataNascimento: new Date("1977-08-17"), cpf: "00000000007", email: "marcelo.pereira7@example.com", numeroFiliado: "2025007" },
    { nomeCompleto: "Guilherme Costa", class: "AP", dataNascimento: new Date("1978-09-18"), cpf: "00000000008", email: "guilherme.costa8@example.com", numeroFiliado: "2025008" },
    { nomeCompleto: "Andre Rodrigues", class: "AP", dataNascimento: new Date("1979-01-10"), cpf: "00000000009", email: "andre.rodrigues9@example.com", numeroFiliado: "2025009" },
    { nomeCompleto: "Felipe Martins", class: "AP", dataNascimento: new Date("1980-02-11"), cpf: "00000000010", email: "felipe.martins10@example.com", numeroFiliado: "2025010" },
    { nomeCompleto: "Diego Gomes", class: "CM", dataNascimento: new Date("1981-03-12"), cpf: "00000000011", email: "diego.gomes11@example.com", numeroFiliado: "2025011" },
    { nomeCompleto: "Tiago Barbosa", class: "CM", dataNascimento: new Date("1982-04-13"), cpf: "00000000012", email: "tiago.barbosa12@example.com", numeroFiliado: "2025012" },
    { nomeCompleto: "Renato Araujo", class: "CM", dataNascimento: new Date("1983-05-14"), cpf: "00000000013", email: "renato.araujo13@example.com", numeroFiliado: "2025013" },
    { nomeCompleto: "Ricardo Melo", class: "CM", dataNascimento: new Date("1984-06-15"), cpf: "00000000014", email: "ricardo.melo14@example.com", numeroFiliado: "2025014" },
    { nomeCompleto: "Matheus Lima", class: "CM", dataNascimento: new Date("1985-07-16"), cpf: "00000000015", email: "matheus.lima15@example.com", numeroFiliado: "2025015" },
    { nomeCompleto: "Vinicius Ribeiro", class: "CM", dataNascimento: new Date("1986-08-17"), cpf: "00000000016", email: "vinicius.ribeiro16@example.com", numeroFiliado: "2025016" },
    { nomeCompleto: "Leandro Carvalho", class: "CM", dataNascimento: new Date("1987-09-18"), cpf: "00000000017", email: "leandro.carvalho17@example.com", numeroFiliado: "2025017" },
    { nomeCompleto: "Eduardo Alves", class: "MM", dataNascimento: new Date("1988-01-10"), cpf: "00000000018", email: "eduardo.alves18@example.com", numeroFiliado: "2025018" },
    { nomeCompleto: "Fabio Castro", class: "MM", dataNascimento: new Date("1989-02-11"), cpf: "00000000019", email: "fabio.castro19@example.com", numeroFiliado: "2025019" },
    { nomeCompleto: "Henrique Mendes", class: "MM", dataNascimento: new Date("1970-03-12"), cpf: "00000000020", email: "henrique.mendes20@example.com", numeroFiliado: "2025020" },
    { nomeCompleto: "Caio Teixeira", class: "MM", dataNascimento: new Date("1971-04-13"), cpf: "00000000021", email: "caio.teixeira21@example.com", numeroFiliado: "2025021" },
    { nomeCompleto: "Wagner Nogueira", class: "MM", dataNascimento: new Date("1972-05-14"), cpf: "00000000022", email: "wagner.nogueira22@example.com", numeroFiliado: "2025022" },
    { nomeCompleto: "Sergio Campos", class: "MI", dataNascimento: new Date("1973-06-15"), cpf: "00000000023", email: "sergio.campos23@example.com", numeroFiliado: "2025023" },
    { nomeCompleto: "Alex Rocha", class: "MI", dataNascimento: new Date("1974-07-16"), cpf: "00000000024", email: "alex.rocha24@example.com", numeroFiliado: "2025024" },
    { nomeCompleto: "Marcos Dias", class: "MI", dataNascimento: new Date("1975-08-17"), cpf: "00000000025", email: "marcos.dias25@example.com", numeroFiliado: "2025025" },

  ];

  const degreeDates: Record<string, Record<string, Date>> = {
    AP: { dataAP: new Date("2018-01-10") },
    CM: { dataAP: new Date("2017-01-10"), dataCM: new Date("2018-02-10") },
    MM: { dataAP: new Date("2016-01-10"), dataCM: new Date("2017-02-10"), dataMM: new Date("2018-03-10") },
    MI: { dataAP: new Date("2015-01-10"), dataCM: new Date("2016-02-10"), dataMM: new Date("2017-03-10"), dataMI: new Date("2018-04-10") },
  };

  const members = await Promise.all(
    membersSeed.map((member, index) =>
      prisma.member.create({
        data: {
          tenantId: defaultTenant.id,
          lojaId: lojaPadrao.id,
          lojaAtualNome: lojaPadrao.lojaMX,
          lojaAtualNumero: lojaPadrao.numero?.toString(),
          dataAdmissao: new Date("2020-01-15"),
          tipoAdmissao: "INIC",
          numeroFiliado: member.numeroFiliado,
          nomeCompleto: member.nomeCompleto,
          dataNascimento: member.dataNascimento,
          pai: `Jose ${member.nomeCompleto.split(' ')[1]}`,
          mae: `Maria ${member.nomeCompleto.split(' ')[1]}`,
          naturalCidade: "Florianopolis",
          naturalUf: "SC",
          nacionalidade: "Brasileira",
          estadoCivil: "CASADO",
          identidadeNumero: `RG-${index + 1}`,
          orgaoEmissor: "SSP-SC",
          dataEmissao: new Date("2010-03-10"),
          cpf: member.cpf,
          email: member.email,
          celular: `+5548999000${String(index + 1).padStart(2, '0')}`,
          telefoneUrgencia: `+5548998000${String(index + 1).padStart(2, '0')}`,
          enderecoLogradouro: "Rua das Palmeiras",
          enderecoCep: "88000-000",
          enderecoBairro: "Centro",
          enderecoCidade: "Florianopolis",
          enderecoUf: "SC",
          escolaridade: "TERCEIRO_GRAU",
          dataIniciacao: new Date("2020-01-15"),
          lojaIniciacaoNome: lojaPadrao.lojaMX,
          lojaIniciacaoNumero: lojaPadrao.numero?.toString(),
          potenciaIniciacaoId: defaultTenant.id,
          situacao: "ATIVO",
          class: member.class,
          ...degreeDates[member.class],
        },
      })
    )
  );

  const [sampleMember, member2, member3] = members;

  console.log(`Created sample members: ${members.length}`);
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
  console.log(`   - Ritos: ${ritos.length}`);
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
