import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exportPath = path.join(process.cwd(), "scripts", "sqlite-export.json");

if (!fs.existsSync(exportPath)) {
  throw new Error(`Export file not found at ${exportPath}`);
}

const raw = fs.readFileSync(exportPath, "utf-8");
const data = JSON.parse(raw) as Record<string, Array<Record<string, any>>>;

const dateFields: Record<string, string[]> = {
  tenant: ["createdAt", "updatedAt"],
  user: ["createdAt", "updatedAt"],
  potencia: ["createdAt", "updatedAt"],
  rito: ["createdAt", "updatedAt"],
  loja: ["mensalidadeValidaAte", "dataFundacao", "createdAt", "updatedAt"],
  member: [
    "dataEntradaLojaAtual",
    "dataAdmissao",
    "dataNascimento",
    "dataEmissao",
    "dataIniciacao",
    "dataPassagem",
    "dataElevacao",
    "dataInstalacao",
    "dataMESA",
    "dataEN",
    "dataCBCS",
    "createdAt",
    "updatedAt",
  ],
  categoria: ["createdAt", "updatedAt"],
  lancamento: ["dataVencimento", "dataPagamento", "createdAt", "updatedAt"],
  inventory_item: ["archivedAt", "createdAt", "updatedAt"],
  inventory_movement: ["createdAt"],
  meeting: ["dataSessao", "createdAt", "updatedAt"],
  attendance: ["createdAt", "updatedAt"],
};

const fieldAllowlist: Record<string, string[]> = {
  tenant: ["id", "name", "createdAt", "updatedAt"],
  user: ["id", "tenantId", "email", "passwordHash", "role", "createdAt", "updatedAt"],
  potencia: [
    "id",
    "tenantId",
    "nome",
    "sigla",
    "email",
    "telefone",
    "website",
    "enderecoLogradouro",
    "enderecoNumero",
    "enderecoComplemento",
    "enderecoBairro",
    "enderecoCidade",
    "enderecoUf",
    "enderecoCep",
    "observacoes",
    "createdAt",
    "updatedAt",
  ],
  rito: ["id", "tenantId", "nome", "sigla", "descricao", "createdAt", "updatedAt"],
  loja: [
    "id",
    "tenantId",
    "potenciaId",
    "lojaMX",
    "numero",
    "contatoNome",
    "contractNumber",
    "mensalidadeAtiva",
    "mensalidadeValidaAte",
    "cnpj",
    "email",
    "telefone",
    "website",
    "enderecoLogradouro",
    "enderecoNumero",
    "enderecoComplemento",
    "enderecoBairro",
    "enderecoCidade",
    "enderecoUf",
    "enderecoCep",
    "dataFundacao",
    "situacao",
    "observacoes",
    "ritoId",
    "createdAt",
    "updatedAt",
  ],
  member: [
    "id",
    "tenantId",
    "lojaId",
    "lojaAtualNome",
    "lojaAtualNumero",
    "dataEntradaLojaAtual",
    "rito",
    "dataAdmissao",
    "tipoAdmissao",
    "numeroFiliado",
    "nomeCompleto",
    "dataNascimento",
    "pai",
    "mae",
    "naturalCidade",
    "naturalUf",
    "nacionalidade",
    "estadoCivil",
    "identidadeNumero",
    "orgaoEmissor",
    "dataEmissao",
    "cpf",
    "email",
    "celular",
    "telefoneUrgencia",
    "enderecoLogradouro",
    "enderecoCep",
    "enderecoBairro",
    "enderecoCidade",
    "enderecoUf",
    "escolaridade",
    "dataIniciacao",
    "lojaIniciacaoNome",
    "lojaIniciacaoNumero",
    "potenciaIniciacaoId",
    "dataPassagem",
    "lojaPassagemNome",
    "lojaPassagemNumero",
    "potenciaPassagemId",
    "dataElevacao",
    "lojaElevacaoNome",
    "lojaElevacaoNumero",
    "potenciaElevacaoId",
    "dataInstalacao",
    "lojaInstalacaoNome",
    "lojaInstalacaoNumero",
    "potenciaInstalacaoId",
    "situacao",
    "class",
    "dataMESA",
    "dataEN",
    "dataCBCS",
    "fotoUrl",
    "createdAt",
    "updatedAt",
  ],
  categoria: ["id", "tenantId", "nome", "createdAt", "updatedAt"],
  lancamento: [
    "id",
    "tenantId",
    "tipo",
    "categoriaId",
    "descricao",
    "valorPrevisto",
    "valorPago",
    "dataVencimento",
    "dataPagamento",
    "status",
    "formaPagamento",
    "anexo",
    "createdAt",
    "updatedAt",
  ],
  inventory_item: [
    "id",
    "tenantId",
    "sku",
    "name",
    "unit",
    "category",
    "location",
    "minQty",
    "reorderPoint",
    "qtyOnHand",
    "avgCost",
    "lastPurchaseCost",
    "assignedToMemberId",
    "notes",
    "createdById",
    "createdByName",
    "updatedById",
    "updatedByName",
    "archivedAt",
    "archivedById",
    "archivedByName",
    "archiveReason",
    "createdAt",
    "updatedAt",
  ],
  inventory_movement: [
    "id",
    "tenantId",
    "itemId",
    "type",
    "qty",
    "unitCost",
    "movementValue",
    "qtyBefore",
    "qtyAfter",
    "avgCostBefore",
    "avgCostAfter",
    "reason",
    "createdById",
    "createdByName",
    "ip",
    "userAgent",
    "createdAt",
  ],
  meeting: ["id", "tenantId", "lojaId", "dataSessao", "tipo", "titulo", "descricao", "observacoes", "createdAt", "updatedAt"],
  attendance: ["id", "tenantId", "meetingId", "memberId", "status", "observacoes", "createdAt", "updatedAt"],
};

const tableOrder = [
  "tenant",
  "user",
  "potencia",
  "rito",
  "loja",
  "member",
  "categoria",
  "lancamento",
  "inventory_item",
  "inventory_movement",
  "meeting",
  "attendance",
];

const toDate = (value: any) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const ms = Math.abs(value) > 100000000000 ? value : value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  return value;
};

const normalizeRow = (table: string, row: Record<string, any>) => {
  const allowed = fieldAllowlist[table] ?? Object.keys(row);
  const normalized: Record<string, any> = {};

  if (table === "loja") {
    const nomeSimboli = row.nomeSimboli ?? row.lojaMX;
    row.lojaMX = row.lojaMX ?? nomeSimboli ?? "Loja sem nome";
    if (row.mensalidadeAtiva !== null && row.mensalidadeAtiva !== undefined) {
      row.mensalidadeAtiva = Boolean(row.mensalidadeAtiva);
    }
  }

  for (const key of allowed) {
    if (!(key in row)) continue;
    let value = row[key];
    if (dateFields[table]?.includes(key)) {
      value = toDate(value);
    }
    normalized[key] = value;
  }

  return normalized;
};

const modelMap = {
  tenant: prisma.tenant,
  user: prisma.user,
  potencia: prisma.potencia,
  rito: prisma.rito,
  loja: prisma.loja,
  member: prisma.member,
  categoria: prisma.categoria,
  lancamento: prisma.lancamento,
  inventory_item: prisma.inventoryItem,
  inventory_movement: prisma.inventoryMovement,
  meeting: prisma.meeting,
  attendance: prisma.attendance,
};

const main = async () => {
  const existingTenants = await prisma.tenant.count();
  if (existingTenants > 0) {
    for (const table of [...tableOrder].reverse()) {
      const model = modelMap[table as keyof typeof modelMap] as any;
      await model.deleteMany();
    }
  }

  for (const table of tableOrder) {
    const rows = data[table] ?? [];
    if (rows.length === 0) continue;

    const records = rows.map((row) => normalizeRow(table, row));
    const model = modelMap[table as keyof typeof modelMap] as any;
    await model.createMany({ data: records });
    console.log(`Imported ${records.length} records into ${table}.`);
  }

  console.log("Import finished.");
};

main()
  .catch((error) => {
    console.error("Import error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
