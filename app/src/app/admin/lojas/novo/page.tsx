import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { LojaForm } from "./loja-form";

async function createLoja(_: { error: string | null }, formData: FormData) {
  "use server";

  const tenantName = formData.get("tenantName")?.toString()?.trim();
  const lojaMX = formData.get("lojaMX")?.toString()?.trim();
  const numeroRaw = formData.get("numero")?.toString();
  const contractNumber = formData.get("contractNumber")?.toString()?.trim();
  const potenciaId = formData.get("potenciaId")?.toString()?.trim();
  const mensalidadeAtivaRaw = formData.get("mensalidadeAtiva")?.toString();
  const mensalidadeValidaAteRaw = formData.get("mensalidadeValidaAte")?.toString();
  const contatoNome = formData.get("contatoNome")?.toString()?.trim();
  const cidade = formData.get("enderecoCidade")?.toString()?.trim();
  const uf = formData.get("enderecoUf")?.toString()?.trim();
  const email = formData.get("email")?.toString()?.trim();
  const telefone = formData.get("telefone")?.toString()?.trim();
  const cnpjRaw = formData.get("cnpj")?.toString() ?? "";
  const cnpjNormalized = normalizeCnpj(cnpjRaw);
  const valorMensalidadeRaw = formData.get("valorMensalidade")?.toString();
  const valorAnuidadeRaw = formData.get("valorAnuidade")?.toString();

  if (!tenantName || !lojaMX || !contractNumber || !contatoNome || !telefone || !potenciaId) {
    return { error: "Tenant, nome da Loja MX, contrato, potencia, contato e telefone sao obrigatorios" };
  }

  if (!valorMensalidadeRaw || !valorAnuidadeRaw) {
    return { error: "Valores de mensalidade e anuidade sao obrigatorios" };
  }

  if (cnpjNormalized && !isValidCnpj(cnpjNormalized)) {
    return { error: "CNPJ invalido" };
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
    },
  });


  await prisma.loja.create({
    data: {
      tenantId: tenant.id,
      potenciaId,
      lojaMX,
      numero: numeroRaw ? Number(numeroRaw) : null,
      cnpj: cnpjNormalized || null,
      contatoNome,
      contractNumber,
      mensalidadeAtiva: mensalidadeAtivaRaw === "on" || mensalidadeAtivaRaw === "true",
      mensalidadeValidaAte: mensalidadeValidaAteRaw ? new Date(mensalidadeValidaAteRaw) : null,
      valorMensalidade: parseFloat(valorMensalidadeRaw!),
      valorAnuidade: parseFloat(valorAnuidadeRaw!),
      situacao: "ATIVA",
      enderecoCidade: cidade,
      enderecoUf: uf,
      email,
      telefone,
    },
  });

  revalidatePath("/admin/lojas");
  revalidatePath("/membros/novo");
  redirect("/admin/lojas");
}

export default async function NovaLojaPage() {
  const potencias = await prisma.potencia.findMany({
    select: {
      id: true,
      nome: true,
      sigla: true,
    },
    orderBy: [{ nome: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Administração do SaaS</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Nova loja</h1>
          <p className="text-sm text-muted-foreground">
            Cria um tenant novo e a loja com dados de contrato/mensalidade. Somente administradores têm acesso.
          </p>
        </div>
      </div>

      <LojaForm action={createLoja} potencias={potencias} />
    </div>
  );
}

function normalizeCnpj(value: string) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function isValidCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcCheckDigit = (base: string) => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base
      .split("")
      .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base = digits.slice(0, 12);
  const first = calcCheckDigit(base);
  const second = calcCheckDigit(`${base}${first}`);
  return digits === `${base}${first}${second}`;
}
