import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getUserFromPayload } from "@/lib/api-auth";
import { PotenciaForm } from "../potencia-form";

type FormState = { error: string | null };

async function getCurrentUser() {
  const token = (await cookies()).get("auth-token")?.value ?? null;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  return getUserFromPayload(payload);
}

async function createPotencia(_: FormState, formData: FormData): Promise<FormState> {
  "use server";

  const user = await getCurrentUser();
  if (!user) return { error: "Nao autorizado." };
  if (user.role !== "ADMIN_SAAS" && user.role !== "SYS_ADMIN") {
    return { error: "Sem permissao para cadastrar potencia." };
  }
  const tenantId = user.tenantId;

  const nome = formData.get("nome")?.toString().trim();
  if (!nome) {
    return { error: "O nome da potencia e obrigatorio." };
  }

  await prisma.potencia.create({
    data: {
      tenantId,
      nome,
      sigla: formData.get("sigla")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      telefone: formData.get("telefone")?.toString().trim() || null,
      website: formData.get("website")?.toString().trim() || null,
      enderecoLogradouro: formData.get("enderecoLogradouro")?.toString().trim() || null,
      enderecoNumero: formData.get("enderecoNumero")?.toString().trim() || null,
      enderecoComplemento: formData.get("enderecoComplemento")?.toString().trim() || null,
      enderecoBairro: formData.get("enderecoBairro")?.toString().trim() || null,
      enderecoCidade: formData.get("enderecoCidade")?.toString().trim() || null,
      enderecoUf: formData.get("enderecoUf")?.toString().trim() || null,
      enderecoCep: formData.get("enderecoCep")?.toString().trim() || null,
      observacoes: formData.get("observacoes")?.toString().trim() || null,
    },
  });

  redirect("/potencias");
}

export default async function NovaPotenciaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN_SAAS" && user.role !== "SYS_ADMIN") {
    redirect("/potencias");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Cadastro</p>
          <h1 className="text-3xl font-bold tracking-tight text-br-deep">Nova potencia</h1>
          <p className="text-sm text-muted-foreground">
            Informe os dados essenciais da potencia.
          </p>
        </div>
      </div>

      <PotenciaForm action={createPotencia} submitLabel="Cadastrar potencia" cancelHref="/potencias" />
    </div>
  );
}
