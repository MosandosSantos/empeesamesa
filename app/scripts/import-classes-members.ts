import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

type Row = {
  Membro?: string;
  CLASSE?: string;
  MESA?: Date | string | number | null;
  EN?: Date | string | number | null;
  CBCS?: Date | string | number | null;
};

const prisma = new PrismaClient();

const STATES = ["RJ", "SP", "MG", "ES", "PR", "SC", "RS"] as const;
const ESTADOS_CIVIS = ["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "UNIAO_ESTAVEL"] as const;
const ESCOLARIDADES = [
  "PRIMEIRO_GRAU",
  "SEGUNDO_GRAU",
  "TERCEIRO_GRAU",
  "POS_GRADUACAO",
  "ESPECIALIZACAO",
  "MESTRADO",
  "DOUTORADO",
] as const;
const TIPOS_ADMISSAO = ["INIC", "FILI", "READ"] as const;

function randomFrom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDate(start: Date, end: Date) {
  const time = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(time);
}

function normalizeDate(value: Row["MESA"]) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "number") {
    // ExcelJS serial date number: days since 1900-01-01
    const excelEpoch = new Date(1899, 11, 30); // Excel epoch (Dec 30, 1899)
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function padCpf(value: number) {
  return value.toString().padStart(11, "0");
}

async function main() {
  // Load workbook with ExcelJS
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("DOCS/classes.xlsx");

  const worksheet = workbook.worksheets[0];

  // Convert worksheet to JSON format similar to xlsx library
  const rows: Row[] = [];
  const headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // First row is headers
      row.eachCell((cell) => {
        headers.push(String(cell.value ?? ""));
      });
    } else {
      // Data rows
      const rowData: Row = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          if (cell.type === ExcelJS.ValueType.Date) {
            (rowData as any)[header] = cell.value;
          } else {
            (rowData as any)[header] = cell.value;
          }
        }
      });
      rows.push(rowData);
    }
  });

  const tenant =
    (await prisma.tenant.findFirst({ where: { name: "Loja Padrao - RER" } })) ??
    (await prisma.tenant.findFirst());

  if (!tenant) {
    throw new Error("Nenhum tenant encontrado para importar membros.");
  }

  const loja = await prisma.loja.findFirst({ where: { tenantId: tenant.id } });
  if (!loja) {
    throw new Error("Nenhuma loja encontrada para o tenant.");
  }

  const baseCpf = 70000000000;
  const baseFiliado = 2025000;

  const dataToInsert = rows
    .map((row, index) => {
      const nome = row.Membro?.toString().trim();
      if (!nome) return null;

      const dataMESA = normalizeDate(row.MESA ?? null);
      const dataEN = normalizeDate(row.EN ?? null);
      const dataCBCS = normalizeDate(row.CBCS ?? null);

      const dataAdmissao =
        dataMESA ??
        dataEN ??
        dataCBCS ??
        randomDate(new Date("2005-01-01"), new Date("2024-12-31"));

      const dataNascimento = randomDate(new Date("1950-01-01"), new Date("1995-12-31"));

      const estado = randomFrom(STATES);
      const enderecoCidade = estado === "RJ" ? "Rio de Janeiro" : "Sao Paulo";
      const cpf = padCpf(baseCpf + index);
      const numeroFiliado = (baseFiliado + index).toString();
      const emailSlug = nome
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/(^\\.|\\.$)/g, "");

      return {
        tenantId: tenant.id,
        lojaId: loja.id,
        lojaAtualNome: loja.nomeSimboli ?? "Loja Padrao",
        lojaAtualNumero: loja.numero?.toString() ?? "1",
        dataEntradaLojaAtual: dataAdmissao,
        rito: "RER",

        dataAdmissao,
        tipoAdmissao: randomFrom(TIPOS_ADMISSAO),
        numeroFiliado,

        nomeCompleto: nome,
        dataNascimento,
        pai: "Pai Desconhecido",
        mae: "Mae Desconhecida",
        naturalCidade: enderecoCidade,
        naturalUf: estado,
        nacionalidade: "Brasileira",
        estadoCivil: randomFrom(ESTADOS_CIVIS),

        identidadeNumero: `RG${String(100000 + index)}`,
        orgaoEmissor: `SSP-${estado}`,
        dataEmissao: randomDate(new Date("2000-01-01"), new Date("2020-12-31")),
        cpf,

        email: `${emailSlug || "membro"}.${index}@lojaexemplo.com`,
        celular: `+5521${String(900000000 + index).slice(0, 9)}`,
        telefoneUrgencia: `+5521${String(910000000 + index).slice(0, 9)}`,

        enderecoLogradouro: "Rua das Lojas, 100",
        enderecoCep: "20000-000",
        enderecoBairro: "Centro",
        enderecoCidade,
        enderecoUf: estado,

        escolaridade: randomFrom(ESCOLARIDADES),

        dataIniciacao: dataAdmissao,
        lojaIniciacaoNome: loja.nomeSimboli ?? "Loja Padrao",
        lojaIniciacaoNumero: loja.numero?.toString() ?? "1",

        situacao: "ATIVO",
        class: row.CLASSE?.toString().trim() ?? null,
        dataMESA,
        dataEN,
        dataCBCS,
      };
    })
    .filter(Boolean);

  if (dataToInsert.length === 0) {
    console.log("Nenhum registro valido encontrado no arquivo.");
    return;
  }

  const existingMembers = await prisma.member.findMany({
    where: { tenantId: tenant.id },
    select: { cpf: true, numeroFiliado: true },
  });
  const existingCpf = new Set(existingMembers.map((m) => m.cpf));
  const existingFiliado = new Set(existingMembers.map((m) => m.numeroFiliado).filter(Boolean));

  const filteredInsert = dataToInsert.filter((member) => {
    if (existingCpf.has(member.cpf)) return false;
    if (member.numeroFiliado && existingFiliado.has(member.numeroFiliado)) return false;
    existingCpf.add(member.cpf);
    if (member.numeroFiliado) existingFiliado.add(member.numeroFiliado);
    return true;
  });

  if (filteredInsert.length === 0) {
    console.log("Todos os registros ja existem no banco.");
    return;
  }

  const result = await prisma.member.createMany({
    data: filteredInsert,
  });

  console.log(`Importacao concluida. Inseridos: ${result.count}`);
}

main()
  .catch((error) => {
    console.error("Erro ao importar membros:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
