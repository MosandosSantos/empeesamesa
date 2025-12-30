"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, DollarSign, Eye, Pencil, Plus, Trash2, UserMinus, Users } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";

export type MemberRow = {
  id: string;
  nome: string;
  situacao: string;
  classe: string;
  dataMESA: Date | null;
  dataEN: Date | null;
  dataCBCS: Date | null;
};

const PAGE_SIZE = 10;

export default function MembersTable({ members }: { members: MemberRow[] }) {
  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<"Todos" | string>("Todos");
  const [filtroClasse, setFiltroClasse] = useState<"Todas" | string>("Todas");
  const [pagina, setPagina] = useState(1);
  const toTitleCase = (name: string) =>
    name
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ");

  const filtrados = useMemo(() => {
    const texto = busca.toLowerCase();
    return members.filter((m) => {
      const matchTexto = m.nome.toLowerCase().includes(texto);
      const matchSituacao = filtroSituacao === "Todos" ? true : m.situacao === filtroSituacao;
      const matchClasse = filtroClasse === "Todas" ? true : m.classe === filtroClasse;
      return matchTexto && matchSituacao && matchClasse;
    });
  }, [busca, filtroClasse, filtroSituacao, members]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicio = (paginaSegura - 1) * PAGE_SIZE;
  const membrosPagina = filtrados.slice(inicio, inicio + PAGE_SIZE);

  const resumo = useMemo(() => {
    return filtrados.reduce(
      (acc, m) => {
        acc.total += 1;
        const key = m.situacao;
        acc.situacoes[key] = (acc.situacoes[key] ?? 0) + 1;
        return acc;
      },
      { total: 0, situacoes: {} as Record<string, number> }
    );
  }, [filtrados]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Membros</h1>
        <p className="text-sm text-muted-foreground">
          Lista carregada do banco (tabela member). Use os filtros para localizar rápido.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          title="Total"
          value={resumo.total}
          detail="Base filtrada"
          icon={Users}
          iconClassName="text-primary"
        />
        <KpiCard
          title="Ativos"
          value={resumo.situacoes["ATIVO"] ?? 0}
          detail="Situacao ATIVO"
          icon={CheckCircle2}
          iconClassName="text-accent"
        />
        <KpiCard
          title="Outros status"
          value={resumo.total - (resumo.situacoes["ATIVO"] ?? 0)}
          detail="Demais situacoes"
          icon={UserMinus}
          iconClassName="text-destructive"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por nome"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none sm:w-64"
              />
              <select
                value={filtroSituacao}
                onChange={(e) => {
                  setFiltroSituacao(e.target.value);
                  setPagina(1);
                }}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none sm:w-48"
              >
                <option value="Todos">Situação: todas</option>
                <option value="ATIVO">ATIVO</option>
                <option value="PROPOSTO">PROPOSTO</option>
                <option value="ADORMECIDO">ADORMECIDO</option>
              </select>
              <select
                value={filtroClasse}
                onChange={(e) => {
                  setFiltroClasse(e.target.value);
                  setPagina(1);
                }}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none sm:w-48"
              >
                <option value="Todas">Classe: todas</option>
                <option value="MESA">MESA (Mestre de Santo Andre)</option>
                <option value="EN">EN (Escudeiro Novico)</option>
                <option value="CBCS">CBCS (Cavaleiro Benfeitor da Cidade Santa)</option>
              </select>
            </div>
            <Link
              href="/membros/novo"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md"
            >
              <Plus size={16} className="text-primary-foreground" aria-hidden />
              <span>Novo membro</span>
            </Link>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[#3b4d3b] text-white">
              <tr>
                <Th>Nome</Th>
                <Th>Situação</Th>
                <Th>Classe</Th>
                <Th>Data MESA</Th>
                <Th>Data EN</Th>
                <Th>Data CBCS</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {membrosPagina.map((m, index) => (
                <tr key={m.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}>
                  <Td>
                    <div className="font-medium text-foreground">{toTitleCase(m.nome)}</div>
                  </Td>
                  <Td>
                    <StatusIndicator situacao={m.situacao} />
                  </Td>
                  <Td>
                    <span className="font-semibold">{m.classe || "-"}</span>
                  </Td>
                  <Td>{formatDate(m.dataMESA)}</Td>
                  <Td>{formatDate(m.dataEN)}</Td>
                  <Td>{formatDate(m.dataCBCS)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/membros/${m.id}`} className="inline-flex">
                        <IconButton label="Visualizar" variant="ghost" icon={<Eye size={16} />} />
                      </Link>
                      <Link href={`/membros/${m.id}/editar`} className="inline-flex">
                        <IconButton label="Editar" variant="default" icon={<Pencil size={16} />} />
                      </Link>
                      <Link href={`/membros/${m.id}/pagamentos`} className="inline-flex">
                        <IconButton
                          label="Pagamento das mensalidades"
                          variant="payment"
                          icon={<DollarSign size={16} />}
                        />
                      </Link>
                      <Link href={`/membros/${m.id}/excluir`} className="inline-flex">
                        <IconButton label="Excluir" variant="danger" icon={<Trash2 size={16} />} />
                      </Link>
                    </div>
                  </Td>
                </tr>
              ))}
              {membrosPagina.length === 0 && (
                <tr>
                  <Td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhum membro encontrado com os filtros aplicados.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
          <span>
            Página {paginaSegura} de {totalPaginas} | {filtrados.length} registros
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaSegura === 1}
              className="h-9 rounded-md border border-border px-3 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaSegura === totalPaginas}
              className="h-9 rounded-md border border-border px-3 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-3 py-2 align-middle text-xs text-foreground ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function StatusIndicator({ situacao }: { situacao: string }) {
  const getSituacaoColor = (situacao: string) => {
    const map: Record<string, string> = {
      ATIVO: "bg-emerald-100 text-emerald-800 border-emerald-200",
      PROPOSTO: "bg-amber-100 text-amber-800 border-amber-200",
      ADORMECIDO: "bg-slate-200 text-slate-800 border-slate-300",
    };
    return map[situacao] ?? "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getSituacaoColor(situacao)}`}
    >
      {situacao}
    </span>
  );
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function IconButton({
  label,
  icon,
  variant,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  variant: "default" | "ghost" | "danger" | "payment";
  onClick?: () => void;
}) {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-xs font-semibold shadow-sm transition hover:shadow-md";
  const styles = {
    default: "text-emerald-700",
    ghost: "text-foreground",
    danger: "text-red-600",
    payment: "text-blue-800",
  }[variant];
  return (
    <button className={`${base} ${styles}`} aria-label={label} title={label} onClick={onClick} type="button">
      {icon}
    </button>
  );
}
