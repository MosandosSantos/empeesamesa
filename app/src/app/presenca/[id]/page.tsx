"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { canAccessPresence } from "@/lib/roles";

interface Member {
  id: string;
  nomeCompleto: string;
  class: string | null;
}

interface Meeting {
  id: string;
  dataSessao: string;
  tipo: string;
  titulo: string | null;
  canMarkAttendance?: boolean;
}

interface AttendanceStatus {
  memberId: string;
  status: "PRESENTE" | "FALTA" | "JUSTIFICADA";
  observacoes?: string;
}

export default function MarcarPresencaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendances, setAttendances] = useState<Map<string, AttendanceStatus>>(
    new Map()
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadData = useCallback(async () => {
    try {
      console.log("Loading data for meeting:", id);

      // Load meeting
      const meetingRes = await fetch(`/api/sessoes/${id}`);
      console.log("Meeting response status:", meetingRes.status);
      if (!meetingRes.ok) throw new Error("Sessão não encontrada");
      const meetingData = await meetingRes.json();
      console.log("Meeting data:", meetingData);
      setMeeting(meetingData);

      // Load members - carregar todos os membros da loja
      const membersRes = await fetch("/api/members");
      console.log("Members response status:", membersRes.status);
      const membersData = await membersRes.json();
      console.log("Members data:", membersData);
      setMembers(membersData || []);

      // Load existing attendances e inicializar TODOS os membros
      const attRes = await fetch(`/api/sessoes/${id}/presenca`);
      console.log("Attendance response status:", attRes.status);

      const attMap = new Map<string, AttendanceStatus>();

      if (attRes.ok) {
        const attData = await attRes.json();
        console.log("Attendance data:", attData);
        attData.forEach((att: any) => {
          attMap.set(att.memberId, {
            memberId: att.memberId,
            status: att.status,
            observacoes: att.observacoes,
          });
        });
      }

      // Inicializar TODOS os membros com FALTA por padrão (se não tiverem registro)
      membersData.forEach((member: Member) => {
        if (!attMap.has(member.id)) {
          attMap.set(member.id, {
            memberId: member.id,
            status: "FALTA",
          });
        }
      });

      console.log(`Attendance map inicializado com ${attMap.size} membros`);
      setAttendances(attMap);

      console.log("Data loaded successfully");
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = (memberId: string, status: "PRESENTE" | "FALTA" | "JUSTIFICADA") => {
    const newAttendances = new Map(attendances);

    newAttendances.set(memberId, {
      memberId,
      status,
    });

    setAttendances(newAttendances);
  };

  // Inicialização já é feita no loadData, não precisa de useEffect separado

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const attendancesList = Array.from(attendances.values());

      console.log("=== SALVANDO PRESENÇAS ===");
      console.log(`Total de membros: ${members.length}`);
      console.log(`Total de presenças a salvar: ${attendancesList.length}`);
      console.log("Detalhes:", attendancesList);

      const res = await fetch(`/api/sessoes/${id}/presenca`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendances: attendancesList,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar presenças");
      }

      setSuccess(true);
      // Redirecionar para a página de presença após 1 segundo
      setTimeout(() => {
        router.push("/presenca");
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Sessão não encontrada</p>
      </div>
    );
  }

  const tipoLabels: Record<string, string> = {
    ORDINARIA: "Ordinária",
    EXTRAORDINARIA: "Extraordinária",
    INICIACAO: "Iniciação",
    INSTALACAO: "Instalação",
    MAGNA: "Magna",
    LUTO: "Luto",
  };

  const presentes = Array.from(attendances.values()).filter(
    (a) => a.status === "PRESENTE"
  ).length;
  const ausentes = members.length - presentes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marcar Presença</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(meeting.dataSessao))}
            {" · "}
            {tipoLabels[meeting.tipo] || meeting.tipo}
            {meeting.titulo && ` · ${meeting.titulo}`}
          </p>
        </div>
        <Link
          href="/presenca"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      {/* Bloqueio por data */}
      {meeting.canMarkAttendance === false && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-8 w-8 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-amber-900 mb-2">
            Sessão ainda não aconteceu.
          </h2>
          <p className="text-sm text-amber-700">
            A marcação de presença só é permitida para sessões que já ocorreram (data da sessão ≤ hoje).
          </p>
        </div>
      )}

      {/* Stats */}
      {meeting.canMarkAttendance !== false && (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Total de Membros</p>
              <p className="text-xl font-bold">{members.length}</p>
            </div>
            <div className="rounded-lg border bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Presentes</p>
              <p className="text-xl font-bold text-emerald-900">{presentes}</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3">
              <p className="text-xs text-slate-700">Ausentes</p>
              <p className="text-xl font-bold text-slate-900">{ausentes}</p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Presenças salvas com sucesso!
            </div>
          )}

          {/* Members List - Tabela com Status */}
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#3b4d3b] text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Nome do Membro
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Classe
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                        Nenhum membro encontrado.
                      </td>
                    </tr>
                  ) : (
                    members.map((member, index) => {
                      const attendance = attendances.get(member.id);
                      const currentStatus = attendance?.status || "FALTA";
                      return (
                        <tr
                          key={member.id}
                          className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-sm text-foreground">
                              {member.nomeCompleto}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                              {member.class || "—"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChange(member.id, e.target.value as "PRESENTE" | "FALTA" | "JUSTIFICADA")}
                              className="w-full max-w-[180px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="FALTA">Falta</option>
                              <option value="PRESENTE">Presente</option>
                              <option value="JUSTIFICADA">Justificada</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white px-6 py-4 border-t border-border">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                <Save size={16} />
                {saving ? "Salvando..." : "Salvar Presenças"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
