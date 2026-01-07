"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Trash2, X, User } from "lucide-react";

type Member = {
  id: string;
  nomeCompleto: string;
  situacao: string;
  class: string | null;
  email: string | null;
};

function getSituacaoColor(situacao: string) {
  const map: Record<string, string> = {
    ATIVO: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PROPOSTO: "bg-amber-100 text-amber-800 border-amber-200",
    ADORMECIDO: "bg-slate-200 text-slate-800 border-slate-300",
  };
  return map[situacao] ?? "bg-slate-100 text-slate-800 border-slate-200";
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

export default function DeleteMemberForm({ member }: { member: Member }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/membros/${member.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir membro");
      }

      // Redirecionar para a listagem após exclusão bem-sucedida
      router.push("/membros");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir membro");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Excluir Membro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirme a exclusão permanente do registro
          </p>
        </div>
        <Link
          href="/membros"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      {/* Card de confirmação */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-red-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-red-900">Atenção: Ação Irreversível</h2>
              <p className="text-sm text-red-700">Os dados serão excluídos permanentemente</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Erro</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Dados do membro */}
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Membro a ser excluído:
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">{member.nomeCompleto}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getSituacaoColor(member.situacao)}`}
                  >
                    {member.situacao}
                  </span>
                  {member.class && (
                    <span className="text-xs text-muted-foreground">· {getClasseLabel(member.class)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">Esta ação não pode ser desfeita</p>
                <p>Todos os dados associados serão removidos do sistema.</p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Link
              href="/membros"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
            >
              <X size={16} />
              Cancelar
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Confirmar Exclusão
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
