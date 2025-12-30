"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/financeiro/status-badge";
import { CurrencyDisplay } from "@/components/financeiro/currency-display";
import { ArrowLeft, Pencil, Trash2, ExternalLink } from "lucide-react";
import { TipoLancamento, StatusLancamento } from "@/types/financeiro";

interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  categoriaId: string;
  descricao: string;
  valorPrevisto: number;
  valorPago: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: StatusLancamento;
  formaPagamento: string | null;
  anexo: string | null;
  categoria: {
    id: string;
    nome: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ContaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lancamento, setLancamento] = useState<Lancamento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLancamento();
  }, [params.id]);

  const fetchLancamento = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contas/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setLancamento(data.lancamento);
      } else {
        router.push("/financeiro/contas");
      }
    } catch (error) {
      console.error("Erro ao buscar lançamento:", error);
      router.push("/financeiro/contas");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) {
      return;
    }

    try {
      const response = await fetch(`/api/contas/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/financeiro/contas");
      } else {
        alert("Erro ao excluir lançamento");
      }
    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);
      alert("Erro ao excluir lançamento");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="text-center text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!lancamento) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/financeiro/contas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalhes da Conta</h1>
            <p className="text-muted-foreground mt-1">
              Visualize as informações completas do lançamento
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/financeiro/contas/${lancamento.id}/editar`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tipo e Status */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tipo</p>
                  <span
                    className={
                      lancamento.tipo === "RECEITA"
                        ? "font-bold text-green-700"
                        : "font-bold text-red-600"
                    }
                  >
                    {lancamento.tipo === "RECEITA" ? "Receita" : "Despesa"}
                  </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                <StatusBadge status={lancamento.status} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Categoria</p>
                <p className="text-lg font-semibold">{lancamento.categoria.nome}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Descrição</p>
              <p className="text-base">{lancamento.descricao}</p>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Valor Previsto</p>
                <p className="text-2xl font-bold">
                  <CurrencyDisplay value={lancamento.valorPrevisto} />
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Valor Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  <CurrencyDisplay value={lancamento.valorPago} />
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Saldo</p>
                <p className={`text-2xl font-bold ${lancamento.valorPrevisto - lancamento.valorPago > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  <CurrencyDisplay value={lancamento.valorPrevisto - lancamento.valorPago} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle>Datas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Data de Vencimento</p>
                <p className="text-lg font-semibold">{formatDate(lancamento.dataVencimento)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Data de Pagamento</p>
                <p className="text-lg font-semibold">
                  {lancamento.dataPagamento ? formatDate(lancamento.dataPagamento) : "Não pago"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagamento */}
        {lancamento.formaPagamento && (
          <Card>
            <CardHeader>
              <CardTitle>Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Método</p>
                  <Badge variant="outline" className="text-base">
                    {lancamento.formaPagamento}
                  </Badge>
                </div>

                {lancamento.anexo && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Comprovante</p>
                    <a
                      href={lancamento.anexo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {lancamento.anexo}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDateTime(lancamento.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Última atualização</p>
                <p className="font-medium">{formatDateTime(lancamento.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
