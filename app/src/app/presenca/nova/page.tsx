"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NovaSessaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    dataSessao: "",
    tipo: "ORDINARIA",
    titulo: "",
    descricao: "",
    observacoes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar sessão");
      }

      router.push("/presenca");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Sessão</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre uma nova sessão para controlar a presença
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Data da Sessão <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.dataSessao}
              onChange={(e) =>
                setFormData({ ...formData, dataSessao: e.target.value })
              }
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="ORDINARIA">Ordinária</option>
              <option value="EXTRAORDINARIA">Extraordinária</option>
              <option value="INICIACAO">Iniciação</option>
              <option value="INSTALACAO">Instalação</option>
              <option value="MAGNA">Magna</option>
              <option value="LUTO">Luto</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Título</label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            placeholder="Ex: Sessão de Admissão"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea
            value={formData.descricao}
            onChange={(e) =>
              setFormData({ ...formData, descricao: e.target.value })
            }
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Descrição da sessão..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Observações</label>
          <textarea
            value={formData.observacoes}
            onChange={(e) =>
              setFormData({ ...formData, observacoes: e.target.value })
            }
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Observações adicionais..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Criar Sessão"}
          </button>
          <Link
            href="/presenca"
            className="h-10 inline-flex items-center rounded-md border border-border px-4 text-sm font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
