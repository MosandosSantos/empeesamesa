import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ArrowLeft, Store, Edit, Trash2 } from "lucide-react";

function fmtDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function getSituacaoColor(situacao: string) {
  const map: Record<string, string> = {
    ATIVA: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ADORMECIDA: "bg-amber-100 text-amber-800 border-amber-200",
    SUSPENSA: "bg-red-100 text-red-800 border-red-200",
    EXTINGUIDA: "bg-slate-200 text-slate-800 border-slate-300",
  };
  return map[situacao] ?? "bg-slate-100 text-slate-800 border-slate-200";
}

function getStatusMensalidade(ativa: boolean): { label: string; color: string } {
  if (!ativa) {
    return {
      label: "Inativa",
      color: "bg-slate-200 text-slate-800 border-slate-300",
    };
  }
  return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
}

export default async function LojaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const loja = await prisma.loja.findUnique({
    where: { id },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
      potencia: {
        select: {
          nome: true,
          sigla: true,
          enderecoCidade: true,
          enderecoUf: true,
        },
      },
      rito: {
        select: {
          nome: true,
          sigla: true,
        },
      },
      _count: {
        select: {
          members: true,
          meetings: true,
        },
      },
    },
  });

  if (!loja) {
    notFound();
  }

  const statusMensalidade = getStatusMensalidade(loja.mensalidadeAtiva);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {loja.lojaMX}
            {loja.numero && <span className="text-muted-foreground"> · Nº {loja.numero}</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSituacaoColor(
                loja.situacao
              )}`}
            >
              {loja.situacao}
            </span>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMensalidade.color}`}
            >
              Mensalidade: {statusMensalidade.label}
            </span>
            {loja.rito && (
              <span className="text-sm text-muted-foreground">
                · {loja.rito.sigla || loja.rito.nome}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/lojas/${loja.id}/editar`}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
          >
            <Edit size={16} />
            Editar
          </Link>
          <Link
            href={`/admin/lojas/${loja.id}/excluir`}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 hover:shadow-md"
          >
            <Trash2 size={16} />
            Excluir
          </Link>
          <Link
            href="/admin/lojas"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <Section title="Informações Gerais" icon={<Store size={18} />}>
          <Field label="Nome da Loja MX" value={loja.lojaMX} />
          <Field label="Número Ritualístico" value={loja.numero?.toString()} />
          <Field label="Tenant (Organização)" value={loja.tenant.name} />
          <Field label="Situação" value={loja.situacao} />
          <Field label="Data de Fundação" value={fmtDate(loja.dataFundacao)} />
          <Field
            label="Potência"
            value={
              loja.potencia.sigla
                ? `${loja.potencia.sigla} - ${loja.potencia.nome}`
                : loja.potencia.nome
            }
          />
          <Field label="Rito" value={loja.rito?.nome} />
          <Field label="CNPJ" value={loja.cnpj} />
          <Field label="Razão social" value={loja.razaoSocial} />
        </Section>

        <Divider />

        <Section title="Contrato SaaS">
          <Field label="Número do Contrato" value={loja.contractNumber} />
          <Field
            label="Status da Mensalidade"
            value={loja.mensalidadeAtiva ? "Ativa" : "Inativa"}
          />
          <Field
            label="Dia de Vencimento da Mensalidade"
            value={loja.mensalidadeVencimentoDia ? `Dia ${loja.mensalidadeVencimentoDia}` : "-"}
          />
          <Field
            label="Tenant Criado em"
            value={fmtDate(loja.tenant.createdAt)}
          />
        </Section>

        <Divider />

        <Section title="Contato">
          <Field label="Nome do Contato" value={loja.contatoNome} />
          <Field label="Email" value={loja.email} />
          <Field label="Telefone" value={loja.telefone} />
          <Field label="Website" value={loja.website} />
        </Section>

        <Divider />

        <Section title="Endereço" cols={2}>
          <Field label="Logradouro" value={loja.enderecoLogradouro} />
          <Field label="Número" value={loja.enderecoNumero} />
          <Field label="Complemento" value={loja.enderecoComplemento} />
          <Field label="Bairro" value={loja.enderecoBairro} />
          <Field
            label="Cidade / UF"
            value={
              loja.enderecoCidade && loja.enderecoUf
                ? `${loja.enderecoCidade} - ${loja.enderecoUf}`
                : loja.enderecoCidade || loja.enderecoUf || "-"
            }
          />
          <Field label="CEP" value={loja.enderecoCep} />
        </Section>

        <Divider />

        <Section title="Estatísticas">
          <Field
            label="Total de Membros"
            value={loja._count.members.toString()}
          />
          <Field
            label="Total de Sessões"
            value={loja._count.meetings.toString()}
          />
          <Field
            label="Localização da Potência"
            value={
              loja.potencia.enderecoCidade && loja.potencia.enderecoUf
                ? `${loja.potencia.enderecoCidade} - ${loja.potencia.enderecoUf}`
                : "-"
            }
          />
        </Section>

        {loja.observacoes && (
          <>
            <Divider />
            <Section title="Observações">
              <div className="col-span-full rounded-md border border-border bg-background px-4 py-3">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {loja.observacoes}
                </p>
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Ações Rápidas */}
      <div className="flex items-center gap-3">
        <Link
          href={`/membros?lojaId=${loja.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Ver Membros ({loja._count.members})
        </Link>
        <Link
          href={`/presenca?lojaId=${loja.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
        >
          Ver Sessões ({loja._count.meetings})
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  icon,
  cols,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  cols?: 2 | 3;
}) {
  const gridClass =
    cols === 2
      ? "grid gap-3 md:grid-cols-2"
      : "grid gap-3 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-emerald-700">{icon}</span>}
        <h2 className="text-lg font-semibold text-br-deep">{title}</h2>
      </div>
      <div className={gridClass}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2.5 transition hover:border-emerald-200">
      <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-900">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-emerald-950">{value || "-"}</div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}
