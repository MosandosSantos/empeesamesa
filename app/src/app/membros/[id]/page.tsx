import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";
import { canViewMembers, isLojaAdmin, isSecretaria, isTesouraria } from "@/lib/roles";
import { ArrowLeft, User } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function getClasseLabel(classe: string | null) {
  if (!classe) return "-";
  const map: Record<string, string> = {
    AP: "AP (Aprendiz)",
    CM: "CM (Companheiro)",
    MM: "MM (Mestre)",
    MI: "MI (Mestre Instalado)",
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
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!canViewMembers(user.role)) {
    redirect("/membros");
  }

  const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role) || isTesouraria(user.role);
  if (needsLojaRestriction && !user.lojaId) {
    redirect("/membros");
  }

  const member = await prisma.member.findUnique({
    where: {
      id,
      tenantId: user.tenantId,
      ...(needsLojaRestriction ? { lojaId: user.lojaId } : {}),
    },
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

      {/* Conte\u00fado */}
      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <Section title={"Identifica\u00e7\u00e3o"} icon={<User size={18} />}>
          <Field label="Nome completo" value={member.nomeCompleto} />
          <Field label="CPF" value={member.cpf} />
          <Field label={"Situa\u00e7\u00e3o"} value={member.situacao} />
          <Field label="Classe Atual" value={getClasseLabel(member.class)} />
          <Field label={"Cadastro Maçônico"} value={member.numeroFiliado} />
          <Field label={"Tipo de Admiss\u00e3o"} value={member.tipoAdmissao} />
          <Field label={"Data de Admiss\u00e3o"} value={fmtDate(member.dataAdmissao)} />
          <Field label="Escolaridade" value={member.escolaridade} />
        </Section>

        <Divider />

        <Section title={"Progress\u00e3o nos Graus Ma\u00e7\u00f4nicos"}>
          <Field
            label="Data AP (Aprendiz)"
            value={fmtDate(member.dataAP)}
          />
          <Field
            label="Data CM (Companheiro)"
            value={fmtDate(member.dataCM)}
          />
          <Field
            label="Data MM (Mestre)"
            value={fmtDate(member.dataMM)}
          />
          <Field
            label="Data MI (Mestre Instalado)"
            value={fmtDate(member.dataMI)}
          />
        </Section>

        <Divider />

        <Section title="Dados Pessoais">
          <Field label="Data de Nascimento" value={fmtDate(member.dataNascimento)} />
          <Field label="Nacionalidade" value={member.nacionalidade} />
          <Field
            label="Naturalidade"
            value={member.naturalCidade}
          />
          <Field label="Estado Civil" value={member.estadoCivil} />
          <Field label="Nome do Pai" value={member.pai} />
          <Field label={"Nome da M\u00e3e"} value={member.mae} />
        </Section>

        <Divider />

        <Section title="Documentos">
          <Field label="RG / Identidade" value={member.identidadeNumero} />
          <Field label={"\u00d3rg\u00e3o Emissor"} value={member.orgaoEmissor} />
          <Field label={"Data de Emiss\u00e3o"} value={fmtDate(member.dataEmissao)} />
          <Field label="CPF" value={member.cpf} />
        </Section>

        <Divider />

        <Section title="Contato">
          <Field label="E-mail" value={member.email} />
          <Field label="Celular" value={member.celular} />
          <Field label={"Telefone de Urg\u00eancia"} value={member.telefoneUrgencia} />
        </Section>

        <Divider />

        <Section title={"Endere\u00e7o"}>
          <Field label="Logradouro" value={member.enderecoLogradouro} />
          <Field label={"N\u00famero"} value={member.enderecoNumero} />
          <Field label="Complemento" value={member.enderecoComplemento} />
          <Field label="Bairro" value={member.enderecoBairro} />
          <Field
            label="Cidade / UF"
            value={`${member.enderecoCidade} - ${member.enderecoUf}`}
          />
          <Field label="CEP" value={member.enderecoCep} />
        </Section>

        <Divider />

        <Section title={"Informa\u00e7\u00f5es Ritual\u00edsticas"} cols={2}>
          {/* Linha 1 */}

          {/* Linha 2 */}
          <Field
            label={"Loja de Inicia\u00e7\u00e3o"}
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
            label={"Data de Eleva\u00e7\u00e3o"}
            value={fmtDate(member.dataElevacao)}
          />
          <Field
            label={"Loja de Eleva\u00e7\u00e3o"}
            value={
              member.lojaElevacaoNome
                ? `${member.lojaElevacaoNome} ${member.lojaElevacaoNumero ? `Nº ${member.lojaElevacaoNumero}` : ""}`
                : "-"
            }
          />

          {/* Linha 5 */}
          <Field
            label={"Data de Instala\u00e7\u00e3o"}
            value={fmtDate(member.dataInstalacao)}
          />
          <Field
            label={"Loja de Instala\u00e7\u00e3o"}
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


