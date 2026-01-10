"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyChart } from "@/components/financeiro/monthly-chart";
import { CategoryPieChart } from "@/components/financeiro/category-pie-chart";
import { CurrencyDisplay } from "@/components/financeiro/currency-display";
import { StatusBadge } from "@/components/financeiro/status-badge";
import { Plus, TrendingUp, TrendingDown, Wallet, DollarSign, Calendar } from "lucide-react";
import { canAccessFinance } from "@/lib/roles";
import { useRoleGuard } from "@/lib/use-role-guard";
import { TipoLancamento } from "@/types/financeiro";

interface DashboardKPIs {
  totalAPagar: number;
  totalAReceber: number;
  totalPago: number;
  totalRecebido: number;
  saldoPrevisto: number;
  saldoRealizado: number;
}

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface DashboardData {
  kpis: DashboardKPIs;
  charts: {
    monthly: MonthlyData[];
    categoryAll: CategoryData[];
    receitasCategories: CategoryData[];
    despesasCategories: CategoryData[];
  };
}

interface LancamentoResumo {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valorPrevisto: number;
  valorPago: number;
  dataVencimento: string;
  status: string;
  categoria: {
    nome: string;
  };
}

const PAGE_SIZE = 10;

export default function FinanceiroPage() {
  const { error: accessError, loading: accessLoading } = useRoleGuard(
    canAccessFinance,
    "Voce nao tem permissao para acessar o financeiro."
  );

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<LancamentoResumo[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsTotalPages, setMovementsTotalPages] = useState(1);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0],
  });

  useEffect(() => {
    if (accessLoading || accessError) {
      return;
    }
    fetchDashboardData();
    setMovementsPage(1);
    fetchMovements();
  }, [accessError, accessLoading, dateRange]);

  useEffect(() => {
    if (accessLoading || accessError) {
      return;
    }
    fetchMovements();
  }, [accessError, accessLoading, movementsPage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dataInicio: dateRange.start,
        dataFim: dateRange.end,
      });

      const response = await fetch(`/api/contas/dashboard?${params.toString()}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentYear = () => {
    const now = new Date();
    setDateRange({
      start: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
      end: new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0],
    });
  };

  const setLastYear = () => {
    const now = new Date();
    setDateRange({
      start: new Date(now.getFullYear() - 1, 0, 1).toISOString().split("T")[0],
      end: new Date(now.getFullYear() - 1, 11, 31).toISOString().split("T")[0],
    });
  };

  const fetchMovements = async () => {
    try {
      setMovementsLoading(true);
      const params = new URLSearchParams({
        dataInicio: dateRange.start,
        dataFim: dateRange.end,
        page: String(movementsPage),
        limit: String(PAGE_SIZE),
      });

      const response = await fetch(`/api/contas?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMovements(data.lancamentos ?? []);
        setMovementsTotalPages(data.pagination?.totalPages ?? 1);
        setMovementsTotal(data.pagination?.total ?? 0);
      }
    } catch (error) {
      console.error("Erro ao buscar movimentacoes:", error);
    } finally {
      setMovementsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const now = new Date();

  const demoMovements: LancamentoResumo[] = [
    {
      id: "demo-1",
      tipo: "RECEITA",
      descricao: "Mensalidade membros - Janeiro",
      valorPrevisto: 1200,
      valorPago: 1200,
      dataVencimento: `${now.getFullYear()}-01-10T00:00:00.000Z`,
      status: "PAGO",
      categoria: { nome: "Mensalidades" },
    },
    {
      id: "demo-2",
      tipo: "DESPESA",
      descricao: "Manutencao da sede",
      valorPrevisto: 450,
      valorPago: 450,
      dataVencimento: `${now.getFullYear()}-01-18T00:00:00.000Z`,
      status: "PAGO",
      categoria: { nome: "Operacional" },
    },
    {
      id: "demo-3",
      tipo: "RECEITA",
      descricao: "Doacoes e campanhas",
      valorPrevisto: 380,
      valorPago: 350,
      dataVencimento: `${now.getFullYear()}-02-08T00:00:00.000Z`,
      status: "PARCIAL",
      categoria: { nome: "Campanhas" },
    },
    {
      id: "demo-4",
      tipo: "DESPESA",
      descricao: "Servicos de internet",
      valorPrevisto: 180,
      valorPago: 180,
      dataVencimento: `${now.getFullYear()}-02-12T00:00:00.000Z`,
      status: "PAGO",
      categoria: { nome: "Servicos" },
    },
    {
      id: "demo-5",
      tipo: "RECEITA",
      descricao: "Mensalidade membros - Marco",
      valorPrevisto: 1450,
      valorPago: 1450,
      dataVencimento: `${now.getFullYear()}-03-09T00:00:00.000Z`,
      status: "PAGO",
      categoria: { nome: "Mensalidades" },
    },
    {
      id: "demo-6",
      tipo: "DESPESA",
      descricao: "Compra de materiais",
      valorPrevisto: 520,
      valorPago: 480,
      dataVencimento: `${now.getFullYear()}-03-20T00:00:00.000Z`,
      status: "PARCIAL",
      categoria: { nome: "Suprimentos" },
    },
    {
      id: "demo-7",
      tipo: "RECEITA",
      descricao: "Eventos e rifas",
      valorPrevisto: 610,
      valorPago: 610,
      dataVencimento: `${now.getFullYear()}-04-06T00:00:00.000Z`,
      status: "PAGO",
      categoria: { nome: "Eventos" },
    },
    {
      id: "demo-8",
      tipo: "DESPESA",
      descricao: "Limpeza e conservacao",
      valorPrevisto: 220,
      valorPago: 0,
      dataVencimento: `${now.getFullYear()}-04-22T00:00:00.000Z`,
      status: "ABERTO",
      categoria: { nome: "Operacional" },
    },
    {
      id: "demo-9",
      tipo: "RECEITA",
      descricao: "Mensalidade membros - Maio",
      valorPrevisto: 1580,
      valorPago: 1580,
      dataVencimento: `${now.getFullYear()}-05-11T00:00:00.000Z`,
      status: "PAGO",
      categoria: { nome: "Mensalidades" },
    },
    {
      id: "demo-10",
      tipo: "DESPESA",
      descricao: "Conta de energia",
      valorPrevisto: 330,
      valorPago: 330,
      dataVencimento: `${now.getFullYear()}-05-17T00:00:00.000Z`,
      status: "PAGO",
      categoria: { nome: "Servicos" },
    },
    {
      id: "demo-11",
      tipo: "RECEITA",
      descricao: "Mensalidade membros - Junho",
      valorPrevisto: 1700,
      valorPago: 1650,
      dataVencimento: `${now.getFullYear()}-06-10T00:00:00.000Z`,
      status: "PARCIAL",
      categoria: { nome: "Mensalidades" },
    },
    {
      id: "demo-12",
      tipo: "DESPESA",
      descricao: "Servicos de contabilidade",
      valorPrevisto: 480,
      valorPago: 480,
      dataVencimento: `${now.getFullYear()}-06-18T00:00:00.000Z`,
      status: "PAGO",
      categoria: { nome: "Administrativo" },
    },
  ];

  const showDemoMovements = !movementsLoading && movements.length === 0;
  const demoTotalPages = Math.max(1, Math.ceil(demoMovements.length / PAGE_SIZE));
  const demoPageSafe = Math.min(movementsPage, demoTotalPages);
  const demoSliceStart = (demoPageSafe - 1) * PAGE_SIZE;
  const demoSlice = demoMovements.slice(demoSliceStart, demoSliceStart + PAGE_SIZE);
  const displayMovements = showDemoMovements ? demoSlice : movements;
  const displayTotalPages = showDemoMovements ? demoTotalPages : movementsTotalPages;
  const displayTotal = showDemoMovements ? demoMovements.length : movementsTotal;

  const demoMonthlyData: MonthlyData[] = [
    { month: `${now.getFullYear()}-01`, receitas: 1200, despesas: 760 },
    { month: `${now.getFullYear()}-02`, receitas: 1380, despesas: 920 },
    { month: `${now.getFullYear()}-03`, receitas: 1560, despesas: 980 },
    { month: `${now.getFullYear()}-04`, receitas: 1490, despesas: 1040 },
    { month: `${now.getFullYear()}-05`, receitas: 1620, despesas: 1100 },
    { month: `${now.getFullYear()}-06`, receitas: 1750, despesas: 1210 },
    { month: `${now.getFullYear()}-07`, receitas: 1680, despesas: 1180 },
    { month: `${now.getFullYear()}-08`, receitas: 1820, despesas: 1300 },
    { month: `${now.getFullYear()}-09`, receitas: 1760, despesas: 1240 },
    { month: `${now.getFullYear()}-10`, receitas: 1900, despesas: 1360 },
    { month: `${now.getFullYear()}-11`, receitas: 2050, despesas: 1420 },
    { month: `${now.getFullYear()}-12`, receitas: 1980, despesas: 1500 },
  ];

  if (accessError) {
    return <p className="text-sm text-red-600">{accessError}</p>;
  }

  if (accessLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (loading || !data) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center text-muted-foreground">Carregando dashboard...</div>
      </div>
    );
  }

  const { kpis, charts } = data;
  const monthlyChartData = charts.monthly.length > 0 ? charts.monthly : demoMonthlyData;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das receitas e despesas da loja
          </p>
        </div>
        <Link href="/financeiro/contas/novo">
          <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </Link>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={setCurrentYear}>
                Ano Atual
              </Button>
              <Button variant="outline" size="sm" onClick={setLastYear}>
                Ano Anterior
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total a Receber */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <CurrencyDisplay value={kpis.totalAReceber} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receitas previstas</p>
          </CardContent>
        </Card>

        {/* Total Recebido */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              <CurrencyDisplay value={kpis.totalRecebido} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receitas efetivadas</p>
          </CardContent>
        </Card>

        {/* Total a Pagar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <CurrencyDisplay value={kpis.totalAPagar} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Despesas previstas</p>
          </CardContent>
        </Card>

        {/* Total Pago */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              <CurrencyDisplay value={kpis.totalPago} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Despesas efetivadas</p>
          </CardContent>
        </Card>

        {/* Saldo Previsto */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Previsto</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.saldoPrevisto >= 0 ? "text-green-600" : "text-red-600"}`}>
              <CurrencyDisplay value={kpis.saldoPrevisto} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas (previsto)</p>
          </CardContent>
        </Card>

        {/* Saldo Realizado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Realizado</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.saldoRealizado >= 0 ? "text-green-600" : "text-red-600"}`}>
              <CurrencyDisplay value={kpis.saldoRealizado} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recebido - Pago (realizado)</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Movimentacoes do Periodo</h2>
        <p className="text-muted-foreground mt-1">
          Descricao de todas as movimentacoes registradas
        </p>
      </div>

      {/* Movements Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {movementsLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Carregando movimentacoes...
          </div>
        ) : displayMovements.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma movimentacao encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#3b4d3b] text-white">
                <TableRow>
                  <TableHead className="text-white">Data</TableHead>
                  <TableHead className="text-white">Descricao</TableHead>
                  <TableHead className="text-white">Categoria</TableHead>
                  <TableHead className="text-white">Tipo</TableHead>
                  <TableHead className="text-right text-white">Valor Previsto</TableHead>
                  <TableHead className="text-right text-white">Valor Pago</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMovements.map((mov, index) => (
                  <TableRow
                    key={mov.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDate(mov.dataVencimento)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {mov.descricao}
                    </TableCell>
                    <TableCell>{mov.categoria.nome}</TableCell>
                    <TableCell>
                      <span
                        className={
                          mov.tipo === "RECEITA"
                            ? "font-bold text-green-700"
                            : "font-bold text-red-600"
                        }
                      >
                        {mov.tipo === "RECEITA" ? "Receita" : "Despesa"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay value={mov.valorPrevisto} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay value={mov.valorPago} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={mov.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!movementsLoading && displayMovements.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              Pagina {showDemoMovements ? demoPageSafe : movementsPage} de {displayTotalPages} | {displayTotal} registros
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMovementsPage((prev) => Math.max(1, prev - 1))}
                disabled={(showDemoMovements ? demoPageSafe : movementsPage) === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMovementsPage((prev) => Math.min(displayTotalPages, prev + 1))}
                disabled={(showDemoMovements ? demoPageSafe : movementsPage) === displayTotalPages}
              >
                Proxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Receitas vs Despesas por Mês</CardTitle>
          <CardDescription>
            Comparativo mensal de valores pagos/recebidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={monthlyChartData} />
        </CardContent>
      </Card>

      {/* Category Charts */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>
                Valores pagos/recebidos agrupados por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={charts.categoryAll} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receitas">
          <Card>
            <CardHeader>
              <CardTitle>Receitas por Categoria</CardTitle>
              <CardDescription>
                Distribuição de receitas recebidas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={charts.receitasCategories} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
              <CardDescription>
                Distribuição de despesas pagas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={charts.despesasCategories} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/financeiro/contas?status=ABERTO" className="block">
              <Button variant="outline" className="w-full justify-start">
                <TrendingDown className="mr-2 h-4 w-4" />
                Ver Contas Abertas
              </Button>
            </Link>
            <Link href="/financeiro/contas?status=ATRASADO" className="block">
              <Button variant="outline" className="w-full justify-start text-red-600">
                <TrendingDown className="mr-2 h-4 w-4" />
                Ver Contas Atrasadas
              </Button>
            </Link>
            <Link href="/financeiro/contas" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Wallet className="mr-2 h-4 w-4" />
                Ver Todas as Contas
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

