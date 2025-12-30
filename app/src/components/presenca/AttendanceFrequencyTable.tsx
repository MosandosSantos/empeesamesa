"use client";

import { useEffect, useState, useMemo } from "react";
import { Check, XCircle, AlertCircle, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface Meeting {
  id: string;
  dataSessao: string;
  tipo: string;
  titulo?: string;
}

interface Member {
  id: string;
  nomeCompleto: string;
  class?: string;
}

interface AttendanceRecord {
  memberId: string;
  meetingId: string;
  status: string;
}

interface MemberStats {
  memberId: string;
  memberName: string;
  memberClass?: string;
  totalPresent: number;
  totalRecorded: number;
  percentage: number;
}

interface FrequencyData {
  meetings: Meeting[];
  members: Member[];
  attendances: AttendanceRecord[];
  memberStats: MemberStats[];
}

interface AttendanceFrequencyTableProps {
  lojaId?: string;
  dataInicio?: string;
  dataFim?: string;
}

type SortField = "name" | "class" | "total" | "percentage";
type SortDirection = "asc" | "desc";

export default function AttendanceFrequencyTable({
  lojaId,
  dataInicio,
  dataFim,
}: AttendanceFrequencyTableProps) {
  const [data, setData] = useState<FrequencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (lojaId) params.append("lojaId", lojaId);
        if (dataInicio) params.append("dataInicio", dataInicio);
        if (dataFim) params.append("dataFim", dataFim);

        const response = await fetch(`/api/presenca/frequencia?${params}`);

        if (!response.ok) {
          throw new Error("Erro ao carregar dados de frequência");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [lojaId, dataInicio, dataFim]);

  // Create attendance map for quick lookup
  const attendanceMap = useMemo(() => {
    if (!data) return new Map<string, string>();

    const map = new Map<string, string>();
    data.attendances.forEach((att) => {
      const key = `${att.memberId}_${att.meetingId}`;
      map.set(key, att.status);
    });

    console.log("=== TABELA DE FREQUÊNCIA - DEBUG ===");
    console.log(`Total de sessões: ${data.meetings.length}`);
    console.log(`Total de membros: ${data.members.length}`);
    console.log(`Total de presenças no mapa: ${map.size}`);
    console.log("Primeiros 5 registros do mapa:");
    let count = 0;
    for (let [key, value] of map.entries()) {
      if (count < 5) {
        console.log(`  ${key} => ${value}`);
        count++;
      }
    }

    return map;
  }, [data]);

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(date);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort members based on current sort field and direction
  const sortedMembers = useMemo(() => {
    if (!data) return [];

    const sorted = [...data.members].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "name":
          compareValue = a.nomeCompleto.localeCompare(b.nomeCompleto, "pt-BR");
          break;
        case "class":
          const classA = a.class || "";
          const classB = b.class || "";
          compareValue = classA.localeCompare(classB, "pt-BR");
          break;
        case "total":
        case "percentage": {
          const statsA = data.memberStats.find((s) => s.memberId === a.id);
          const statsB = data.memberStats.find((s) => s.memberId === b.id);

          if (sortField === "total") {
            compareValue = (statsA?.totalPresent || 0) - (statsB?.totalPresent || 0);
          } else {
            compareValue = (statsA?.percentage || 0) - (statsB?.percentage || 0);
          }
          break;
        }
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });

    return sorted;
  }, [data, sortField, sortDirection]);

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-emerald-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-emerald-600" />
    );
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">
            Carregando tabela de frequência...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!data || data.members.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-center text-sm text-muted-foreground">
          Nenhum membro ativo encontrado.
        </p>
      </div>
    );
  }

  if (data.meetings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-center text-sm text-muted-foreground">
          Nenhuma sessão encontrada no período selecionado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Tabela de Frequência
          </h2>
          <p className="text-sm text-muted-foreground">
            {data.members.length} membros • {data.meetings.length} sessões
          </p>
        </div>
      </div>

      {/* Table Container with horizontal scroll */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#3b4d3b] text-white">
              <tr>
                {/* Fixed columns */}
                <th className="sticky left-0 z-10 bg-[#3b4d3b] px-4 py-3 text-left font-semibold">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-2 hover:text-emerald-300 transition-colors"
                  >
                    <span>Nome</span>
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  <button
                    onClick={() => handleSort("class")}
                    className="flex items-center gap-2 hover:text-emerald-300 transition-colors"
                  >
                    <span>Classe</span>
                    <SortIcon field="class" />
                  </button>
                </th>

                {/* Dynamic meeting columns */}
                {data.meetings.map((meeting) => (
                  <th
                    key={meeting.id}
                    className="px-2 py-3 text-center font-semibold"
                    title={`${meeting.titulo || meeting.tipo} - ${new Intl.DateTimeFormat("pt-BR").format(new Date(meeting.dataSessao))}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs">{formatDate(meeting.dataSessao)}</span>
                    </div>
                  </th>
                ))}

                {/* Summary columns */}
                <th className="px-4 py-3 text-center font-semibold">
                  <button
                    onClick={() => handleSort("percentage")}
                    className="inline-flex items-center gap-2 hover:text-emerald-300 transition-colors"
                  >
                    <span>%</span>
                    <SortIcon field="percentage" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  <button
                    onClick={() => handleSort("total")}
                    className="inline-flex items-center gap-2 hover:text-emerald-300 transition-colors"
                  >
                    <span>Total</span>
                    <SortIcon field="total" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member, index) => {
                const stats = data.memberStats.find(
                  (s) => s.memberId === member.id
                );

                return (
                  <tr
                    key={member.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}
                  >
                    {/* Fixed columns */}
                    <td className="sticky left-0 z-10 px-4 py-3 font-medium bg-inherit">
                      {member.nomeCompleto}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {member.class || "—"}
                    </td>

                    {/* Dynamic attendance cells */}
                    {data.meetings.map((meeting, idx) => {
                      const key = `${member.id}_${meeting.id}`;
                      const status = attendanceMap.get(key);

                      // Debug apenas para o primeiro membro e primeira sessão
                      if (idx === 0 && member.id === data.members[0]?.id) {
                        console.log(`Célula [${member.nomeCompleto} - ${formatDate(meeting.dataSessao)}]:`);
                        console.log(`  Key: ${key}`);
                        console.log(`  Status: ${status || "undefined"}`);
                      }

                      return (
                        <td
                          key={meeting.id}
                          className="px-2 py-3 text-center"
                        >
                          {status === "PRESENTE" && (
                            <div className="flex justify-center">
                              <Check className="h-4 w-4 text-emerald-600" />
                            </div>
                          )}
                          {status === "FALTA" && (
                            <div className="flex justify-center">
                              <XCircle className="h-5 w-5 text-red-600 fill-red-50" />
                            </div>
                          )}
                          {status === "JUSTIFICADA" && (
                            <div className="flex justify-center">
                              <AlertCircle className="h-5 w-5 text-amber-600 fill-amber-50" />
                            </div>
                          )}
                          {!status && (
                            <div className="flex justify-center">
                              <span className="text-xs text-gray-300">—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Summary columns */}
                    <td className="px-4 py-3 text-center font-semibold">
                      <span
                        className={
                          stats && stats.percentage >= 75
                            ? "text-emerald-700"
                            : stats && stats.percentage >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                        }
                      >
                        {stats?.percentage || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {stats?.totalPresent || 0}/{stats?.totalRecorded || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Presente</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600 fill-red-50" />
          <span>Falta</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 fill-amber-50" />
          <span>Justificada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-300">—</span>
          <span>Sem registro</span>
        </div>
      </div>
    </div>
  );
}
