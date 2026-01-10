"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Trash2, X, Store } from "lucide-react";

type Loja = {
  id: string;
  nome: string;
  numero?: number;
  tenantName: string;
  situacao: string;
  contrato: string;
  contatoNome: string;
  telefone: string;
  cidadeUf: string;
  validade: string | null;
};


export default function DeleteLojaForm({ loja }: { loja: Loja }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/lojas/${loja.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMsg = data.details
          ? `${data.error}\n\nDetalhes: ${data.details}`
          : data.error || "Erro ao excluir loja";
        throw new Error(errorMsg);
      }

      router.push("/admin/lojas");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao excluir loja";
      setError(message);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Excluir loja</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirme a exclusão permanente desta loja.
          </p>
        </div>
        <Link
          href="/admin/lojas"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-red-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-red-900">Atenção: ação irreversível</h2>
              <p className="text-sm text-red-700">Esta exclusão remove a loja e os dados vinculados.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Erro ao excluir loja</p>
                <div className="mt-1 text-sm text-red-700 whitespace-pre-line">{error}</div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Loja a ser excluída:
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">
                  {loja.nome}
                  {loja.numero ? ` #${loja.numero}` : ""}
                </h3>
                <p className="text-xs text-muted-foreground">Organização (tenant): {loja.tenantName}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <span className="font-semibold text-foreground">Contrato:</span> {loja.contrato}
              </div>
              <div>
                <span className="font-semibold text-foreground">Situação:</span> {loja.situacao}
              </div>
              <div>
                <span className="font-semibold text-foreground">Contato:</span> {loja.contatoNome}
              </div>
              <div>
                <span className="font-semibold text-foreground">Telefone:</span> {loja.telefone}
              </div>
              <div>
                <span className="font-semibold text-foreground">Cidade/UF:</span> {loja.cidadeUf}
              </div>
              <div>
                <span className="font-semibold text-foreground">Dia de vencimento da mensalidade:</span>{" "}
                {loja.validade || "-"}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div className="text-sm text-amber-900">
                <p className="mb-1 font-semibold">Esta ação não pode ser desfeita.</p>
                <p>Revise as informações antes de confirmar.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href="/admin/lojas"
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
                  Confirmar exclusão
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


