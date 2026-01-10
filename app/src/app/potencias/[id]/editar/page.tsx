import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getUserFromPayload } from "@/lib/api-auth";
import { PotenciaForm } from "../../potencia-form";

type FormState = { error: string | null };

async function getCurrentUser() {
  const token = (await cookies()).get("auth-token")?.value ?? null;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  return getUserFromPayload(payload);
}

export default async function EditarPotenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const tenantId = user?.tenantId ?? null;

  const potencia = await prisma.potencia.findFirst({
    where: { id, ...(tenantId ? { tenantId } : {}) },
  });

  if (!potencia) {
    notFound();
  }

  if (user?.role !== "ADMIN_SAAS" && user?.role !== "SYS_ADMIN") {
    redirect("/potencias");
  }

  async function updatePotencia(_: FormState, formData: FormData): Promise<FormState> {
    "use server";

    const userInner = await getCurrentUser();
    if (!userInner) return { error: "N\u00e3o autorizado." };
    if (userInner.role !== "ADMIN_SAAS" && userInner.role !== "SYS_ADMIN") {
      return { error: "Sem permiss\u00e3o para editar prefeitura." };
    }

    const nome = formData.get("nome")?.toString().trim();
    if (!nome) {
      return { error: "O nome da prefeitura \u00e9 obrigat\u00f3rio." };
    }

    await prisma.potencia.update({
      where: { id: potencia.id },
      data: {
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {"Atualiza\u00e7\u00e3o"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-br-deep">Editar prefeitura</h1>
          <p className="text-sm text-muted-foreground">
            Atualize os dados principais da prefeitura.
          </p>
        </div>
        <Link
          href="/potencias"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-muted hover:border-gray-400"
        >
          Voltar
        </Link>
      </div>

      <PotenciaForm
        action={updatePotencia}
        submitLabel="Salvar altera\u00e7\u00f5es"
        cancelHref="/potencias"
        initialData={{
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
        }}
      />
    </div>
  );
}

