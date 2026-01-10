import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";
import { LojaForm } from "./loja-form";

async function createLoja(_: { error: string | null }, formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Usuario nao autenticado." };
  }

  const isSysAdmin = user.role === "SYS_ADMIN";
  if (user.role === "ADMIN_SAAS") {
    return { error: "Administrador do SaaS nao pode cadastrar lojas." };
  }

  const lojaMX = formData.get("lojaMX")?.toString()?.trim();
  const shortName = formData.get("shortName")?.toString()?.trim();
  const numeroRaw = formData.get("numero")?.toString();
  const contractNumber = formData.get("contractNumber")?.toString()?.trim();
  const ritoId = formData.get("ritoId")?.toString()?.trim();
  const mensalidadeAtivaRaw = formData.get("mensalidadeAtiva")?.toString();
  const mensalidadeVencimentoDiaRaw = formData.get("mensalidadeVencimentoDia")?.toString();
  const contatoNome = formData.get("contatoNome")?.toString()?.trim();
  const enderecoCep = formData.get("enderecoCep")?.toString()?.trim();
  const enderecoLogradouro = formData.get("enderecoLogradouro")?.toString()?.trim();
  const enderecoNumero = formData.get("enderecoNumero")?.toString()?.trim();
  const enderecoComplemento = formData.get("enderecoComplemento")?.toString()?.trim();
  const enderecoBairro = formData.get("enderecoBairro")?.toString()?.trim();
  const enderecoCidade = formData.get("enderecoCidade")?.toString()?.trim();
  const enderecoUf = formData.get("enderecoUf")?.toString()?.trim();
  const email = formData.get("email")?.toString()?.trim();
  const telefone = formData.get("telefone")?.toString()?.trim();
  const cnpjRaw = formData.get("cnpj")?.toString() ?? "";
  const cnpjNormalized = normalizeCnpj(cnpjRaw);
  const razaoSocial = formData.get("razaoSocial")?.toString()?.trim();
  const nomeFantasia = formData.get("nomeFantasia")?.toString()?.trim();
  const dataAberturaRaw = formData.get("dataAbertura")?.toString();
  const valorMensalidadeRaw = formData.get("valorMensalidade")?.toString();
  const mensalidadeRegularRaw = formData.get("mensalidadeRegular")?.toString();
  const mensalidadeFiliadoRaw = formData.get("mensalidadeFiliado")?.toString();
  const mensalidadeRemidoRaw = formData.get("mensalidadeRemido")?.toString();

  // Dados bancários
  const bancoCodigo = formData.get("bancoCodigo")?.toString()?.trim();
  const bancoNome = formData.get("bancoNome")?.toString()?.trim();
  const bancoAgencia = formData.get("bancoAgencia")?.toString()?.trim();
  const bancoAgenciaDigito = formData.get("bancoAgenciaDigito")?.toString()?.trim();
  const bancoConta = formData.get("bancoConta")?.toString()?.trim();
  const bancoContaDigito = formData.get("bancoContaDigito")?.toString()?.trim();
  const bancoTipoConta = formData.get("bancoTipoConta")?.toString()?.trim();
  const bancoPix = formData.get("bancoPix")?.toString()?.trim();

  // Observações
  const observacoes = formData.get("observacoes")?.toString()?.trim();

    if (!lojaMX || !shortName || !contractNumber || !contatoNome || !telefone) {
    return { error: "Campos obrigatorios: nome da loja, nome curto, contrato, responsavel e telefone." };
  }

  const existingShortName = await prisma.loja.findFirst({
    where: { shortName: { equals: shortName, mode: "insensitive" } },
    select: { id: true },
  });

  if (existingShortName) {
    return { error: "Nome curto ja existe. Escolha outro nome." };
  }

  const existingTenant = await prisma.tenant.findFirst({
    where: {
      name: { equals: shortName, mode: "insensitive" },
      ...(isSysAdmin ? {} : { id: { not: user.tenantId } }),
    },
    select: { id: true },
  });

  if (existingTenant) {
    return { error: "Tenant ja existe. Escolha outro nome curto." };
  }

  if (!valorMensalidadeRaw) {
    return { error: "O valor da mensalidade é obrigatório." };
  }

  if (cnpjNormalized && !isValidCnpj(cnpjNormalized)) {
    return { error: "O CNPJ informado é inválido. Verifique e tente novamente." };
  }

  // Validar dia de vencimento se fornecido
  if (mensalidadeVencimentoDiaRaw) {
    const dia = parseInt(mensalidadeVencimentoDiaRaw);
    if (isNaN(dia) || dia < 1 || dia > 31) {
      return { error: "O dia de vencimento deve estar entre 1 e 31." };
    }
  }

  let tenantId = user.tenantId;
  if (!isSysAdmin) {
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { name: shortName! },
    });
  }
  if (isSysAdmin) {
    const tenant = await prisma.tenant.create({
      data: {
        name: shortName!,
      },
    });
    tenantId = tenant.id;
  }

  const potencia = user.potenciaId
    ? await prisma.potencia.findFirst({
        where: { id: user.potenciaId, tenantId: user.tenantId },
        select: { id: true },
      })
    : await prisma.potencia.findFirst({
        where: { tenantId },
        orderBy: { nome: "asc" },
        select: { id: true },
      });

  if (!potencia) {
    return {
      error: "Nenhuma prefeitura encontrada para este tenant. Cadastre a prefeitura antes de criar a loja.",
    };
  }

  const baseMensalidade = parseFloat(valorMensalidadeRaw!);

  await prisma.loja.create({
    data: {
      tenantId,
      potenciaId: potencia.id,
      ritoId: ritoId || null,
      lojaMX,
      numero: numeroRaw ? Number(numeroRaw) : null,
      cnpj: cnpjNormalized || null,
      razaoSocial: razaoSocial || null,
      nomeFantasia: nomeFantasia || null,
      dataAbertura: dataAberturaRaw ? new Date(dataAberturaRaw) : null,
      contatoNome,
      contractNumber,
      mensalidadeAtiva: mensalidadeAtivaRaw === "on" || mensalidadeAtivaRaw === "true",
      mensalidadeVencimentoDia: mensalidadeVencimentoDiaRaw ? parseInt(mensalidadeVencimentoDiaRaw) : null,
      valorMensalidade: baseMensalidade,
      mensalidadeRegular: mensalidadeRegularRaw
        ? parseFloat(mensalidadeRegularRaw)
        : baseMensalidade,
      mensalidadeFiliado: mensalidadeFiliadoRaw
        ? parseFloat(mensalidadeFiliadoRaw)
        : baseMensalidade,
      mensalidadeRemido: mensalidadeRemidoRaw
        ? parseFloat(mensalidadeRemidoRaw)
        : baseMensalidade,
      situacao: "ATIVA",
      enderecoCep: enderecoCep || null,
      enderecoLogradouro: enderecoLogradouro || null,
      enderecoNumero: enderecoNumero || null,
      enderecoComplemento: enderecoComplemento || null,
      enderecoBairro: enderecoBairro || null,
      enderecoCidade: enderecoCidade || null,
      enderecoUf: enderecoUf || null,
      email,
      telefone,
      // Dados bancários
      bancoCodigo: bancoCodigo || null,
      bancoNome: bancoNome || null,
      bancoAgencia: bancoAgencia || null,
      bancoAgenciaDigito: bancoAgenciaDigito || null,
      bancoConta: bancoConta || null,
      bancoContaDigito: bancoContaDigito || null,
      bancoTipoConta: bancoTipoConta || null,
      bancoPix: bancoPix || null,
      // Observações
      observacoes: observacoes || null,
    },
  });

  revalidatePath("/admin/lojas");
  revalidatePath("/membros/novo");
  redirect("/admin/lojas");
}

export default async function NovaLojaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "ADMIN_SAAS") {
    redirect("/admin/lojas");
  }

  const potencia = user.potenciaId
    ? await prisma.potencia.findFirst({
        where: { id: user.potenciaId, tenantId: user.tenantId },
        select: { nome: true, sigla: true },
      })
    : await prisma.potencia.findFirst({
        where: { tenantId: user.tenantId },
        orderBy: { nome: "asc" },
        select: { nome: true, sigla: true },
      });

  const ritos = await prisma.rito.findMany({
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
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Administração do Sistema</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cadastrar nova loja</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre um novo tenant (organização) e sua respectiva loja com informações de contrato e mensalidade.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Somente administradores do sistema têm acesso a esta funcionalidade.
          </p>
        </div>
      </div>

      {potencia ? (
        <LojaForm
          action={createLoja}
          potenciaLabel={potencia.sigla ? `${potencia.sigla} - ${potencia.nome}` : potencia.nome}
          ritos={ritos}
        />
      ) : (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Nenhuma prefeitura encontrada para este tenant. Cadastre a prefeitura antes de criar a loja.
        </div>
      )}
    </div>
  );
}

function normalizeCnpj(value: string) {
  return value.replace(/[^\d]/g, "");
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
