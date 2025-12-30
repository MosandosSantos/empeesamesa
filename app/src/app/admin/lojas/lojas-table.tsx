"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";

export type LojaRow = {
  id: string;
  nome: string;
  numero?: number;
  tenantId: string;
  tenantName: string;
  potencia?: string | null;
  contrato: string;
  contatoNome?: string | null;
  telefone?: string | null;
  status: "ATIVA" | "VENCIDA" | "SUSPENSA";
  validade: string | null;
  situacao: string;
  cidadeUf: string;
};

const PAGE_SIZE = 10;

export default function LojasTable({
  lojas,
  stats,
}: {
  lojas: LojaRow[];
  stats: { total: number; ativas: number; vencidas: number };
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"Todas" | LojaRow["status"]>("Todas");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    const texto = busca.toLowerCase();
    return lojas.filter((l) => {
      const matchTexto =
        l.nome.toLowerCase().includes(texto) ||
        l.tenantName.toLowerCase().includes(texto) ||
        l.contrato.toLowerCase().includes(texto) ||
        (l.potencia ?? "").toLowerCase().includes(texto) ||
        (l.cidadeUf ?? "").toLowerCase().includes(texto);
      const matchStatus = filtroStatus === "Todas" ? true : l.status === filtroStatus;
      return matchTexto && matchStatus;
    });
  }, [busca, filtroStatus, lojas]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicio = (paginaSegura - 1) * PAGE_SIZE;
  const lojasPagina = filtrados.slice(inicio, inicio + PAGE_SIZE);

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nome, tenant, contrato ou cidade"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none md:w-96"
          />
          <select
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value as LojaRow["status"] | "Todas");
              setPagina(1);
            }}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none md:w-56"
          >
            <option value="Todas">Status: Todos</option>
            <option value="ATIVA">ATIVA</option>
            <option value="VENCIDA">VENCIDA</option>
            <option value="SUSPENSA">SUSPENSA</option>
          </select>
        </div>
        <Link
          href="/admin/lojas/novo"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md"
        >
          <Plus size={16} className="text-primary-foreground" aria-hidden />
          <span>Incluir loja</span>
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <InfoCard titulo="Total" valor={stats.total} />
        <InfoCard titulo="Mensalidade ativa" valor={stats.ativas} />
        <InfoCard titulo="Mensalidade vencida" valor={stats.vencidas} />
      </div>

      <div className="mt-5 overflow-x-auto rounded-md border border-border">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-[#3b4d3b] text-white">
            <tr>
              <Th>Loja</Th>
              <Th>Potencia</Th>
              <Th>Contato</Th>
              <Th>Telefone</Th>
              <Th>Vencimento</Th>
              <Th>Status</Th>
              <Th>Cidade/UF</Th>
              <Th className="text-right">Acoes</Th>
            </tr>
          </thead>
          <tbody>
            {lojasPagina.map((l, index) => (
              <tr key={l.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}>
                <Td>
                  <div className="font-medium text-foreground">
                    {l.nome}
                    {l.numero ? ` · Nº ${l.numero}` : ""}
                  </div>
                </Td>
                <Td>
                  <div className="text-[11px] text-muted-foreground">
                    {l.potencia ?? "Sem potencia"}
                  </div>
                </Td>
                <Td>
                  <div className="text-[11px] text-muted-foreground">
                    {l.contatoNome ?? "Sem contato"}
                  </div>
                </Td>
                <Td>
                  <div className="text-[11px] text-muted-foreground">
                    {l.telefone ?? "Sem telefone"}
                  </div>
                </Td>
               
                <Td>
                  <div className="text-[11px] text-muted-foreground">
                    {l.validade ? formatDate(l.validade) : "sem data"}
                  </div>
                </Td>
                <Td>
                  <StatusDot status={l.status} />
                </Td>
                <Td>{l.cidadeUf}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/lojas/${l.id}`} className="inline-flex">
                      <IconButton label="Visualizar" variant="ghost" icon={<Eye size={16} />} />
                    </Link>
                    <Link href={`/admin/lojas/${l.id}/editar`} className="inline-flex">
                      <IconButton label="Editar" variant="default" icon={<Pencil size={16} />} />
                    </Link>
                    <Link href={`/admin/lojas/${l.id}/excluir`} className="inline-flex">
                      <IconButton label="Excluir" variant="danger" icon={<Trash2 size={16} />} />
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
            {lojasPagina.length === 0 && (
              <tr>
                <Td colSpan={8} className="py-8 text-center text-muted-foreground">
                  Nenhuma loja encontrada com os filtros aplicados.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
        <span>
          Pagina {paginaSegura} de {totalPaginas} · {filtrados.length} registros
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
            Proxima
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function InfoCard({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{valor}</p>
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

function StatusDot({ status }: { status: LojaRow["status"] }) {
  const color = status === "ATIVA" ? "bg-emerald-500" : "bg-red-500";
  const label =
    status === "ATIVA"
      ? "Mensalidade em dia"
      : status === "VENCIDA"
        ? "Mensalidade vencida"
        : "Mensalidade suspensa";
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={`inline-block h-3.5 w-3.5 rounded-full ${color}`} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function IconButton({
  label,
  icon,
  variant,
}: {
  label: string;
  icon: ReactNode;
  variant: "default" | "ghost" | "danger";
}) {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-xs font-semibold shadow-sm transition hover:shadow-md";
  const styles = {
    default: "text-emerald-700",
    ghost: "text-foreground",
    danger: "text-red-600",
  }[variant];
  return (
    <button className={`${base} ${styles}`} aria-label={label} title={label}>
      {icon}
    </button>
  );
}
