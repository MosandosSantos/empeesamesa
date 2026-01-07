import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getUserFromPayload } from "@/lib/api-auth";

async function getCurrentUser() {
  const token = (await cookies()).get("auth-token")?.value ?? null;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  return getUserFromPayload(payload);
}

export default async function PotenciaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const tenantId = user?.tenantId ?? null;

  const potencia = await prisma.potencia.findFirst({
    where: {
      id,
      ...(tenantId ? { tenantId } : {}),
    },
    include: {
      _count: {
        select: {
          lojas: true,
        },
      },
    },
  });

  if (!potencia) {
    notFound();
  }

  if (user?.role === "ADMIN_POT" && user.potenciaId !== potencia.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-br-deep">{potencia.nome}</h1>
          <p className="text-sm text-muted-foreground">{potencia.sigla || "-"}</p>
        </div>
        <div className="flex items-center gap-2">
          {(user?.role === "ADMIN_SAAS" || user?.role === "SYS_ADMIN") && (
            <>
              <Link
                href={`/potencias/${potencia.id}/editar`}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
              >
                <Edit size={16} />
                Editar
              </Link>
              <Link
                href={`/potencias/${potencia.id}/excluir`}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 hover:shadow-md"
              >
                <Trash2 size={16} />
                Excluir
              </Link>
            </>
          )}
          <Link
            href="/potencias"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>
      </div>

      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <Section title="Dados principais">
          <Field label="Nome" value={potencia.nome} />
          <Field label="Sigla" value={potencia.sigla} />
          <Field label="Email" value={potencia.email} />
          <Field label="Telefone" value={potencia.telefone} />
          <Field label="Website" value={potencia.website} />
        </Section>

        <Divider />

        <Section title="Endereco" cols={2}>
          <Field label="CEP" value={potencia.enderecoCep} />
          <Field label="Logradouro" value={potencia.enderecoLogradouro} />
          <Field label="Numero" value={potencia.enderecoNumero} />
          <Field label="Complemento" value={potencia.enderecoComplemento} />
          <Field label="Bairro" value={potencia.enderecoBairro} />
          <Field
            label="Cidade / UF"
            value={
              potencia.enderecoCidade && potencia.enderecoUf
                ? `${potencia.enderecoCidade} - ${potencia.enderecoUf}`
                : potencia.enderecoCidade || potencia.enderecoUf || "-"
            }
          />
        </Section>

        <Divider />

        <Section title="Resumo">
          <Field label="Lojas vinculadas" value={potencia._count.lojas.toString()} />
        </Section>

        {potencia.observacoes && (
          <>
            <Divider />
            <Section title="Observacoes">
              <div className="col-span-full rounded-md border border-border bg-background px-4 py-3">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {potencia.observacoes}
                </p>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  cols,
}: {
  title: string;
  children: React.ReactNode;
  cols?: 2 | 3;
}) {
  const gridClass =
    cols === 2
      ? "grid gap-3 md:grid-cols-2"
      : "grid gap-3 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-br-deep">{title}</h2>
      <div className={gridClass}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2.5 transition hover:border-emerald-200">
      <div className="text-[11px] font-medium uppercase tracking-wide text-br-deep">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-emerald-950">{value || "-"}</div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}
