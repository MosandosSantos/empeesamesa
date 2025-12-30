"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Users, Trash2 } from "lucide-react";
import AttendanceFrequencyTable from "@/components/presenca/AttendanceFrequencyTable";

interface Meeting {
  id: string;
  dataSessao: string;
  tipo: string;
  titulo?: string;
  loja?: {
    lojaMX: string;
    numero?: string;
  };
  _count: {
    attendances: number;
  };
}

interface PresencaClientProps {
  initialMeetings: Meeting[];
}

export default function PresencaClient({ initialMeetings }: PresencaClientProps) {
  const router = useRouter();
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [lojaId, setLojaId] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteMeeting = async (meetingId: string, meetingDate: string) => {
    const confirmMessage = `Tem certeza que deseja excluir esta sessão?\n\nData: ${new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(meetingDate))}\n\nTodos os registros de presença desta sessão também serão excluídos.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingId(meetingId);

    try {
      const res = await fetch(`/api/sessoes/${meetingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir sessão");
      }

      // Recarregar a página para atualizar a lista
      router.refresh();
    } catch (error: any) {
      alert(`Erro ao excluir sessão: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const tipoLabels: Record<string, string> = {
    ORDINARIA: "Ordinária",
    EXTRAORDINARIA: "Extraordinária",
    INICIACAO: "Iniciação",
    INSTALACAO: "Instalação",
    MAGNA: "Magna",
    LUTO: "Luto",
  };

  // Calculate stats from initial meetings
  const now = new Date();
  const sessoesMes = initialMeetings.filter((m) => {
    const date = new Date(m.dataSessao);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const proximaSessao = initialMeetings.find(
    (m) => new Date(m.dataSessao) > now
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Presença e Sessões
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie sessões e controle a presença dos membros
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Calendar size={20} />}
          label="Total de Sessões"
          value={initialMeetings.length}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Sessões Este Mês"
          value={sessoesMes}
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Próxima Sessão"
          value={proximaSessao ? "Agendada" : "Nenhuma"}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/presenca/nova"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
        >
          <Plus size={16} />
          Nova Sessão
        </Link>
        <Link
          href="/presenca/relatorios"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
        >
          Relatórios
        </Link>
      </div>

      {/* Filters for Frequency Table */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">
            Filtros da Tabela de Frequência
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="dataInicio" className="text-sm font-medium">
                Data Início
              </label>
              <input
                type="date"
                id="dataInicio"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="dataFim" className="text-sm font-medium">
                Data Fim
              </label>
              <input
                type="date"
                id="dataFim"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDataInicio("");
                  setDataFim("");
                  setLojaId("");
                }}
                className="h-10 rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Sessões Recentes
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#3b4d3b] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Loja</th>
                <th className="px-4 py-3 text-center font-semibold">
                  Presenças
                </th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialMeetings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nenhuma sessão cadastrada. Clique em "Nova Sessão" para
                    começar.
                  </td>
                </tr>
              ) : (
                initialMeetings.map((meeting, index) => (
                  <tr
                    key={meeting.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}
                  >
                    <td className="px-4 py-3 font-medium">
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }).format(new Date(meeting.dataSessao))}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                        {tipoLabels[meeting.tipo] || meeting.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {meeting.titulo || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {meeting.loja ? (
                        <span>
                          {meeting.loja.lojaMX}
                          {meeting.loja.numero && ` Nº ${meeting.loja.numero}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} className="text-muted-foreground" />
                        {meeting._count.attendances}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/presenca/${meeting.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <Users size={14} />
                          Marcar Presença
                        </Link>
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id, meeting.dataSessao)}
                          disabled={deletingId === meeting.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          title="Excluir sessão"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Frequency Table */}
      <AttendanceFrequencyTable
        lojaId={lojaId || undefined}
        dataInicio={dataInicio || undefined}
        dataFim={dataFim || undefined}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-emerald-700">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
