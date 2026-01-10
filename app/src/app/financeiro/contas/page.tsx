"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/financeiro/status-badge";
import { CurrencyDisplay } from "@/components/financeiro/currency-display";
import { Plus, Eye, Pencil, Trash2, Filter } from "lucide-react";
import { StatusLancamento, TipoLancamento } from "@/types/financeiro";
import { canAccessFinance } from "@/lib/roles";
import { useRoleGuard } from "@/lib/use-role-guard";

interface Categoria {
  id: string;
  nome: string;
}

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
  categoria: {
    id: string;
    nome: string;
  };
}

export default function ContasPage() {
  const { error: accessError, loading: accessLoading } = useRoleGuard(
    canAccessFinance,
    "Voce nao tem permissao para acessar o financeiro."
  );

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: "ALL",
    status: "ALL",
    categoriaId: "ALL",
    dataInicio: "",
    dataFim: "",
  });

  useEffect(() => {
    if (accessLoading || accessError) {
      return;
    }
    fetchCategorias();
    fetchLancamentos();
  }, [accessError, accessLoading]);

  useEffect(() => {
    if (accessLoading || accessError) {
      return;
    }
    fetchLancamentos();
  }, [accessError, accessLoading, filters]);

  if (accessError) {
    return <p className="text-sm text-red-600">{accessError}</p>;
  }

  if (accessLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch("/api/categorias");
      if (response.ok) {
        const data = await response.json();
        setCategorias(data.categorias);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const fetchLancamentos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.tipo !== "ALL") params.append("tipo", filters.tipo);
      if (filters.status !== "ALL") params.append("status", filters.status);
      if (filters.categoriaId !== "ALL") params.append("categoriaId", filters.categoriaId);
      if (filters.dataInicio) params.append("dataInicio", filters.dataInicio);
      if (filters.dataFim) params.append("dataFim", filters.dataFim);

      const response = await fetch(`/api/contas?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLancamentos(data.lancamentos);
      }
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) {
      return;
    }

    try {
      const response = await fetch(`/api/contas/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchLancamentos();
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

  const clearFilters = () => {
    setFilters({
      tipo: "ALL",
      status: "ALL",
      categoriaId: "ALL",
      dataInicio: "",
      dataFim: "",
    });
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar e Receber</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie receitas e despesas da loja
          </p>
        </div>
        <Link href="/financeiro/contas/novo">
          <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Select
            value={filters.tipo}
            onValueChange={(value) => setFilters({ ...filters, tipo: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="RECEITA">Receita</SelectItem>
              <SelectItem value="DESPESA">Despesa</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ABERTO">Aberto</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="PARCIAL">Parcial</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
              <SelectItem value="PREVISTO">Previsto</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.categoriaId}
            onValueChange={(value) => setFilters({ ...filters, categoriaId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="Data Início"
            value={filters.dataInicio}
            onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
          />

          <Input
            type="date"
            placeholder="Data Fim"
            value={filters.dataFim}
            onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
          />
        </div>
        {(filters.tipo !== "ALL" ||
          filters.status !== "ALL" ||
          filters.categoriaId !== "ALL" ||
          filters.dataInicio ||
          filters.dataFim) && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="mt-4"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : lancamentos.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum lançamento encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor Previsto</TableHead>
                  <TableHead className="text-right">Valor Pago</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((lanc) => (
                  <TableRow key={lanc.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(lanc.dataVencimento)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {lanc.descricao}
                    </TableCell>
                    <TableCell>{lanc.categoria.nome}</TableCell>
                    <TableCell>
                      <span
                        className={
                          lanc.tipo === "RECEITA"
                            ? "font-bold text-green-700"
                            : "font-bold text-red-600"
                        }
                      >
                        {lanc.tipo === "RECEITA" ? "Receita" : "Despesa"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay value={lanc.valorPrevisto} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay value={lanc.valorPago} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lanc.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/financeiro/contas/${lanc.id}`}>
                          <Button variant="ghost" size="icon" title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/financeiro/contas/${lanc.id}/editar`}>
                          <Button variant="ghost" size="icon" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          onClick={() => handleDelete(lanc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
