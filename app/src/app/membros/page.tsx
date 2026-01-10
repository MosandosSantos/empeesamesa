"use client";

import { useEffect, useState } from "react";
import MembersTable, { MemberRow } from "./members-table";
import type { UserRole } from "@/lib/roles";

type MembersResponse = {
  members: Array<{
    id: string;
    nomeCompleto: string;
    situacao: string;
    class: string | null;
    cargo: string | null;
    dataNascimento: string | null;
    dataAP: string | null;
    dataCM: string | null;
    dataMM: string | null;
    dataMI: string | null;
  }>;
};

export default function MembrosPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadMembers = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/membros");
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao carregar membros");
        }

        const data: MembersResponse = await response.json();
        const rows = data.members.map((m) => ({
          id: m.id,
          nome: m.nomeCompleto,
          situacao: m.situacao,
          classe: m.class ?? "",
          cargo: m.cargo ?? "SC",
          dataNascimento: m.dataNascimento ? new Date(m.dataNascimento) : null,
          dataAP: m.dataAP ? new Date(m.dataAP) : null,
          dataCM: m.dataCM ? new Date(m.dataCM) : null,
          dataMM: m.dataMM ? new Date(m.dataMM) : null,
          dataMI: m.dataMI ? new Date(m.dataMI) : null,
        }));

        if (mounted) {
          setMembers(rows);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erro ao carregar membros");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const loadRole = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const data = await response.json();
        if (mounted) {
          setRole(data?.user?.role ?? null);
        }
      } catch {
        // ignore
      }
    };

    loadMembers();
    loadRole();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando membros...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return <MembersTable members={members} currentRole={role} />;
}
