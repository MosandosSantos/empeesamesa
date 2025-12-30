import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { ArrowLeft, User } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function getClasseLabel(classe: string | null) {
  if (!classe) return "-";
  const map: Record<string, string> = {
    MESA: "MESA (Mestre de Santo André)",
    EN: "EN (Escudeiro Noviço)",
    CBCS: "CBCS (Cavaleiro Benfeitor da Cidade Santa)",
  };
  return map[classe] ?? classe;
}

function getSituacaoColor(situacao: string) {
  const map: Record<string, string> = {
    ATIVO: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PROPOSTO: "bg-amber-100 text-amber-800 border-amber-200",
    ADORMECIDO: "bg-slate-200 text-slate-800 border-slate-300",
  };
  return map[situacao] ?? "bg-slate-100 text-slate-800 border-slate-200";
}

export default async function MembroDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value ?? null;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    redirect("/login");
  }

  const member = await prisma.member.findUnique({
    where: { id, tenantId: payload.tenantId },
  });

  if (!member) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {member.nomeCompleto}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSituacaoColor(
                member.situacao
              )}`}
            >
              {member.situacao}
            </span>
            {member.class && (
              <span className="text-sm text-muted-foreground">
                · {getClasseLabel(member.class)}
              </span>
            )}
          </div>
        </div>
        <Link
          href="/membros"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      {/* Conteúdo */}
      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <Section title="Identificação" icon={<User size={18} />}>
          <Field label="Nome completo" value={member.nomeCompleto} />
          <Field label="CPF" value={member.cpf} />
          <Field label="Situação" value={member.situacao} />
          <Field label="Classe Atual" value={getClasseLabel(member.class)} />
          <Field label="Número de Filiado" value={member.numeroFiliado} />
          <Field label="Tipo de Admissão" value={member.tipoAdmissao} />
          <Field label="Data de Admissão" value={fmtDate(member.dataAdmissao)} />
          <Field label="Escolaridade" value={member.escolaridade} />
        </Section>

        <Divider />

        <Section title="Progressão nas Classes (RER)">
          <Field
            label="Data MESA (Mestre de Santo André)"
            value={fmtDate(member.dataMESA)}
          />
          <Field
            label="Data EN (Escudeiro Noviço)"
            value={fmtDate(member.dataEN)}
          />
          <Field
            label="Data CBCS (Cavaleiro Benfeitor)"
            value={fmtDate(member.dataCBCS)}
          />
        </Section>

        <Divider />

        <Section title="Dados Pessoais">
          <Field label="Data de Nascimento" value={fmtDate(member.dataNascimento)} />
          <Field label="Nacionalidade" value={member.nacionalidade} />
          <Field
            label="Naturalidade"
            value={`${member.naturalCidade} - ${member.naturalUf}`}
          />
          <Field label="Estado Civil" value={member.estadoCivil} />
          <Field label="Nome do Pai" value={member.pai} />
          <Field label="Nome da Mãe" value={member.mae} />
        </Section>

        <Divider />

        <Section title="Documentos">
          <Field label="RG / Identidade" value={member.identidadeNumero} />
          <Field label="Órgão Emissor" value={member.orgaoEmissor} />
          <Field label="Data de Emissão" value={fmtDate(member.dataEmissao)} />
          <Field label="CPF" value={member.cpf} />
        </Section>

        <Divider />

        <Section title="Contato">
          <Field label="Email" value={member.email} />
          <Field label="Celular" value={member.celular} />
          <Field label="Telefone de Urgência" value={member.telefoneUrgencia} />
        </Section>

        <Divider />

        <Section title="Endereço">
          <Field label="Logradouro" value={member.enderecoLogradouro} />
          <Field label="Bairro" value={member.enderecoBairro} />
          <Field
            label="Cidade / UF"
            value={`${member.enderecoCidade} - ${member.enderecoUf}`}
          />
          <Field label="CEP" value={member.enderecoCep} />
        </Section>

        <Divider />

        <Section title="Informações Ritualísticas" cols={2}>
          {/* Linha 1 */}
          <Field
            label="Loja Atual"
            value={
              member.lojaAtualNome
                ? `${member.lojaAtualNome} ${member.lojaAtualNumero ? `Nº ${member.lojaAtualNumero}` : ""}`
                : "-"
            }
          />
          <Field
            label="Data de Entrada"
            value={fmtDate(member.dataEntradaLojaAtual)}
          />

          {/* Linha 2 */}
          <Field label="Rito" value={member.rito} />
          <Field
            label="Loja de Iniciação"
            value={
              member.lojaIniciacaoNome
                ? `${member.lojaIniciacaoNome} ${member.lojaIniciacaoNumero ? `Nº ${member.lojaIniciacaoNumero}` : ""}`
                : "-"
            }
          />

          {/* Linha 3 */}
          <Field
            label="Data de Passagem"
            value={fmtDate(member.dataPassagem)}
          />
          <Field
            label="Loja de Passagem"
            value={
              member.lojaPassagemNome
                ? `${member.lojaPassagemNome} ${member.lojaPassagemNumero ? `Nº ${member.lojaPassagemNumero}` : ""}`
                : "-"
            }
          />

          {/* Linha 4 */}
          <Field
            label="Data de Elevação"
            value={fmtDate(member.dataElevacao)}
          />
          <Field
            label="Loja de Elevação"
            value={
              member.lojaElevacaoNome
                ? `${member.lojaElevacaoNome} ${member.lojaElevacaoNumero ? `Nº ${member.lojaElevacaoNumero}` : ""}`
                : "-"
            }
          />

          {/* Linha 5 */}
          <Field
            label="Data de Instalação"
            value={fmtDate(member.dataInstalacao)}
          />
          <Field
            label="Loja de Instalação"
            value={
              member.lojaInstalacaoNome
                ? `${member.lojaInstalacaoNome} ${member.lojaInstalacaoNumero ? `Nº ${member.lojaInstalacaoNumero}` : ""}`
                : "-"
            }
          />
        </Section>
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
  const gridClass = cols === 2
    ? "grid gap-3 md:grid-cols-2"
    : "grid gap-3 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-emerald-700">{icon}</span>}
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className={gridClass}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2.5 transition hover:border-emerald-200">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value || "-"}</div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}
