"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState<"ranking" | "por-periodo">("ranking");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tipo });
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);

      const res = await fetch(`/api/presenca/relatorios?${params}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [tipo, dataInicio, dataFim]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Presença</h1>
          <p className="text-sm text-muted-foreground">
            Análise de assiduidade e presença dos membros
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

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Relatório</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="ranking">Ranking de Assiduidade</option>
              <option value="por-periodo">Por Período</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReport}
              className="h-10 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando...
        </div>
      ) : data ? (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {tipo === "ranking" && data.ranking && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Ranking de Assiduidade</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#3b4d3b] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Membro</th>
                      <th className="px-4 py-3 text-left">Classe</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3 text-center">Presentes</th>
                      <th className="px-4 py-3 text-center">Faltas</th>
                      <th className="px-4 py-3 text-center">% Presença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ranking.map((item: any, index: number) => (
                      <tr
                        key={item.member.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}
                      >
                        <td className="px-4 py-3 font-medium">{index + 1}</td>
                        <td className="px-4 py-3">{item.member.nomeCompleto}</td>
                        <td className="px-4 py-3">{item.member.class || "—"}</td>
                        <td className="px-4 py-3 text-center">{item.total}</td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-medium">
                          {item.presentes}
                        </td>
                        <td className="px-4 py-3 text-center text-red-700 font-medium">
                          {item.faltas}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              item.percentualPresenca >= 75
                                ? "bg-emerald-100 text-emerald-800"
                                : item.percentualPresenca >= 50
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.percentualPresenca}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tipo === "por-periodo" && data.resumo && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Presença por Período</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#3b4d3b] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-left">Título</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3 text-center">Presentes</th>
                      <th className="px-4 py-3 text-center">Faltas</th>
                      <th className="px-4 py-3 text-center">% Presença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.resumo.map((item: any, index: number) => (
                      <tr
                        key={item.meetingId}
                        className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}
                      >
                        <td className="px-4 py-3">
                          {new Intl.DateTimeFormat("pt-BR").format(
                            new Date(item.dataSessao)
                          )}
                        </td>
                        <td className="px-4 py-3">{item.tipo}</td>
                        <td className="px-4 py-3">{item.titulo || "—"}</td>
                        <td className="px-4 py-3 text-center">{item.total}</td>
                        <td className="px-4 py-3 text-center text-emerald-700">
                          {item.presentes}
                        </td>
                        <td className="px-4 py-3 text-center text-red-700">
                          {item.faltas}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                            {item.percentualPresenca}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
