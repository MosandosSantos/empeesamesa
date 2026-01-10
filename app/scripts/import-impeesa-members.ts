import "dotenv/config";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type RowMap = {
  memberName?: string;
  className?: string;
  cpf?: string;
  endereco?: string;
  cidade?: string;
  cep?: string;
  uf?: string;
  celular?: string;
  email?: string;
  dataMesa?: Date | null;
  dataEn?: Date | null;
  dataCbcs?: Date | null;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const parseBrDate = (value: string) => {
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map((part) => parseInt(part, 10));
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDate = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    // ExcelJS serial date number: days since 1900-01-01
    // Convert Excel serial date to JS Date
    const excelEpoch = new Date(1899, 11, 30); // Excel epoch (Dec 30, 1899)
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const brDate = parseBrDate(trimmed);
    if (brDate) return brDate;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 32);

const padNumber = (value: number, size: number) => value.toString().padStart(size, "0");

const buildPhone = (index: number) => `+5521998${padNumber(index + 1, 4)}${padNumber(index + 1, 2)}`;

const findFilePath = () => {
  const docsDir = path.join(process.cwd(), "DOCS");
  const files = fs.readdirSync(docsDir);
  const target = files.find((file) =>
    file.toLowerCase().includes("listagem") && file.toLowerCase().includes("impeesa") && file.endsWith(".xlsx")
  );

  if (!target) {
    throw new Error("Arquivo LISTAGEM IMPEESA nao encontrado em app/DOCS.");
  }

  return path.join(docsDir, target);
};

const extractRows = (worksheet: ExcelJS.Worksheet) => {
  const rows: unknown[][] = [];

  // Convert worksheet to array of arrays
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const rowValues: unknown[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Get the actual value, preferring date objects for date cells
      if (cell.type === ExcelJS.ValueType.Date) {
        rowValues[colNumber - 1] = cell.value;
      } else {
        rowValues[colNumber - 1] = cell.value;
      }
    });
    rows.push(rowValues);
  });

  const headerIndex = rows.findIndex((row) => row.some((cell) => String(cell).trim() === "Membro"));
  if (headerIndex < 0) {
    throw new Error("Cabecalho com coluna Membro nao encontrado.");
  }

  const headerRow = rows[headerIndex].map((cell) => String(cell ?? "").trim());
  const headerMap = new Map<string, number>();
  headerRow.forEach((cell, index) => {
    if (!cell) return;
    headerMap.set(normalize(cell), index);
  });

  const findIndex = (key: string) => {
    const normalizedKey = normalize(key);
    for (const [header, index] of headerMap.entries()) {
      if (header.includes(normalizedKey)) return index;
    }
    return -1;
  };

  const colIndex = {
    memberName: findIndex("membro"),
    className: findIndex("classe"),
    cpf: findIndex("cpf"),
    endereco: findIndex("endereco"),
    cidade: findIndex("cidade"),
    cep: findIndex("cep"),
    uf: findIndex("estado"),
    celular: findIndex("telefone celular"),
    email: findIndex("email"),
    dataMesa: findIndex("mesa"),
    dataEn: findIndex("en"),
    dataCbcs: findIndex("cbcs"),
  };

  const dataRows = rows.slice(headerIndex + 1);
  const parsedRows: RowMap[] = [];

  for (const row of dataRows) {
    const memberNameRaw = colIndex.memberName >= 0 ? row[colIndex.memberName] : null;
    const memberName = memberNameRaw ? String(memberNameRaw).trim() : "";
    if (!memberName) continue;

    parsedRows.push({
      memberName,
      className: colIndex.className >= 0 ? String(row[colIndex.className] ?? "").trim() || undefined : undefined,
      cpf: colIndex.cpf >= 0 ? String(row[colIndex.cpf] ?? "").trim() || undefined : undefined,
      endereco: colIndex.endereco >= 0 ? String(row[colIndex.endereco] ?? "").trim() || undefined : undefined,
      cidade: colIndex.cidade >= 0 ? String(row[colIndex.cidade] ?? "").trim() || undefined : undefined,
      cep: colIndex.cep >= 0 ? String(row[colIndex.cep] ?? "").trim() || undefined : undefined,
      uf: colIndex.uf >= 0 ? String(row[colIndex.uf] ?? "").trim() || undefined : undefined,
      celular: colIndex.celular >= 0 ? String(row[colIndex.celular] ?? "").trim() || undefined : undefined,
      email: colIndex.email >= 0 ? String(row[colIndex.email] ?? "").trim() || undefined : undefined,
      dataMesa: colIndex.dataMesa >= 0 ? parseDate(row[colIndex.dataMesa]) : null,
      dataEn: colIndex.dataEn >= 0 ? parseDate(row[colIndex.dataEn]) : null,
      dataCbcs: colIndex.dataCbcs >= 0 ? parseDate(row[colIndex.dataCbcs]) : null,
    });
  }

  return parsedRows;
};

const sanitizeCpf = (cpf: string | undefined) => {
  if (!cpf) return "";
  return cpf.replace(/\D/g, "");
};

const generateCpf = (seed: number) => (70000000000 + seed).toString();

const main = async () => {
  const filePath = findFilePath();

  // Load workbook with ExcelJS
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet("Lista Geral") ?? workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("Nenhuma planilha encontrada.");
  }

  const rows = extractRows(worksheet);
  if (rows.length === 0) {
    console.log("Nenhum membro encontrado para importar.");
    return;
  }

  let tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: "Tenant Impeesa" } });
  }

  let potencia = await prisma.potencia.findFirst({ where: { tenantId: tenant.id } });
  if (!potencia) {
    potencia = await prisma.potencia.create({
      data: {
        tenantId: tenant.id,
        nome: "Prefeitura Sao Sebastiao",
        sigla: "PreSS",
      },
    });
  }

  let loja = await prisma.loja.findFirst({
    where: {
      tenantId: tenant.id,
      OR: [{ numero: 17 }, { lojaMX: { contains: "IMPEESA" } }],
    },
  });

  if (!loja) {
    loja = await prisma.loja.create({
      data: {
        tenantId: tenant.id,
        potenciaId: potencia.id,
        lojaMX: "IMPEESA",
        numero: 17,
        situacao: "ATIVA",
        mensalidadeAtiva: true,
      },
    });
  }

  const existingCpfs = await prisma.member.findMany({
    where: { tenantId: tenant.id },
    select: { cpf: true },
  });

  const cpfSet = new Set(existingCpfs.map((item) => item.cpf));

  let createdCount = 0;
  let skippedCount = 0;
  let generatedCpfSeed = 1;

  for (const [index, row] of rows.entries()) {
    const name = row.memberName?.trim();
    if (!name) continue;

    const rawCpf = sanitizeCpf(row.cpf);
    let cpf = rawCpf.length === 11 ? rawCpf : "";
    while (!cpf || cpfSet.has(cpf)) {
      cpf = generateCpf(generatedCpfSeed);
      generatedCpfSeed += 1;
    }

    const existingMember = await prisma.member.findFirst({
      where: { tenantId: tenant.id, cpf },
      select: { id: true },
    });

    if (existingMember) {
      skippedCount += 1;
      continue;
    }

    const dataMesa = row.dataMesa ?? null;
    const dataEn = row.dataEn ?? null;
    const dataCbcs = row.dataCbcs ?? null;
    const dataAdmissao = dataMesa ?? dataEn ?? dataCbcs ?? new Date("2020-01-01");
    const dataNascimento = new Date(1980, 0, 1 + index);

    const emailSlug = row.email?.trim() || `${slugify(name)}.${index + 1}@impeesa17.local`;
    const celular = row.celular?.trim() || buildPhone(index);
    const endereco = row.endereco?.trim() || "Rua Desconhecida, 0";
    const cidade = row.cidade?.trim() || "Rio de Janeiro";
    const cep = row.cep?.trim() || "00000-000";
    const uf = row.uf?.trim().toUpperCase() || "RJ";

    await prisma.member.create({
      data: {
        tenantId: tenant.id,
        lojaId: loja.id,
        rito: null,
        dataAdmissao,
        tipoAdmissao: "INIC",
        numeroFiliado: `IMP17-${padNumber(index + 1, 4)}`,
        nomeCompleto: name,
        dataNascimento,
        pai: "Nao informado",
        mae: "Nao informado",
        naturalCidade: cidade,
        nacionalidade: "Brasileira",
        estadoCivil: "SOLTEIRO",
        identidadeNumero: `RG${padNumber(index + 1, 6)}`,
        orgaoEmissor: "SSP-RJ",
        dataEmissao: new Date("2010-01-01"),
        cpf,
        email: emailSlug,
        celular,
        telefoneUrgencia: celular,
        enderecoLogradouro: endereco,
        enderecoCep: cep,
        enderecoBairro: "Centro",
        enderecoCidade: cidade,
        enderecoUf: uf,
        escolaridade: "SEGUNDO_GRAU",
        situacao: "ATIVO",
        class: row.className || null,
        dataMESA: dataMesa,
        dataEN: dataEn,
        dataCBCS: dataCbcs,
      },
    });

    cpfSet.add(cpf);
    createdCount += 1;
  }

  console.log(`Importacao concluida. Criados: ${createdCount}. Ignorados: ${skippedCount}.`);
};

main()
  .catch((error) => {
    console.error("Erro na importacao:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
