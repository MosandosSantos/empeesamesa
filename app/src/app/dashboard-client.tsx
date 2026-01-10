"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { Users, Calendar, CheckCircle2, Landmark, Wallet, Package, DollarSign } from "lucide-react";
import { isSaasAdmin } from "@/lib/roles";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DashboardClientProps = {
  activeMembers: number;
  newMembersLast12Months: number;
  belowMinCount: number;
  saldoMes: number;
  solicitacoesAbertas: number;
  solicitacoesRecebidas: number;
  riteDistribution: Array<{ name: string; value: number }>;
  classDistribution: Array<{ name: string; value: number }>;
};

const getBarGreen = (index: number, total: number) => {
  const min = 0.4;
  const max = 0.78;
  const ratio = total > 1 ? index / (total - 1) : 0;
  const lightness = min + (max - min) * ratio;
  return `oklch(${lightness} 0.16 145)`;
};

const donutColors = [
  "oklch(0.45 0.15 145)",
  "oklch(0.55 0.22 25)",
  "oklch(0.62 0.18 85)",
];

export function DashboardClient({
  activeMembers,
  newMembersLast12Months,
  belowMinCount,
  saldoMes,
  solicitacoesAbertas,
  solicitacoesRecebidas,
  riteDistribution,
  classDistribution,
}: DashboardClientProps) {
  const classTotal = classDistribution.reduce((acc, item) => acc + item.value, 0);
  const kpis = [
    {
      title: "Membros Ativos",
      value: activeMembers.toString(),
      change: `Novos membros ultimos 12 meses: ${newMembersLast12Months}`,
      detailClassName: "text-xs font-semibold text-emerald-600",
      icon: Users,
    },
    {
      title: "Saldo",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(saldoMes),
      change: "Receita - Despesa (mês atual)",
      icon: Wallet,
    },
    {
      title: "Estoque",
      value: belowMinCount.toString(),
      change: "Itens abaixo do minimo",
      icon: Package,
    },
    {
      title: "Chancelaria",
      value: String(solicitacoesAbertas + solicitacoesRecebidas),
      change: `A prefeitura: ${solicitacoesAbertas} | Da prefeitura: ${solicitacoesRecebidas}`,
      icon: Landmark,
    },
  ];

  const [monthlyAttendance, setMonthlyAttendance] = useState<{
    monthLabel: string;
    presentes: number;
    faltas: number;
  } | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<Array<{ mes: string; receitas: number; despesas: number }>>([]);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const quickActionsDisabled = isSaasAdmin(role);

  useEffect(() => {
    let isMounted = true;

    const fetchAttendance = async () => {
      setAttendanceLoading(true);
      try {
        const now = new Date();
        const params = new URLSearchParams({
          month: String(now.getMonth() + 1),
          year: String(now.getFullYear()),
        });
        const response = await fetch(`/api/presenca/dashboard?${params.toString()}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error ?? "Erro ao carregar dados de presença");
        }

        if (!isMounted) return;

        setMonthlyAttendance({
          monthLabel: payload.monthLabel ?? "",
          presentes: payload.presentes ?? 0,
          faltas: payload.faltas ?? 0,
        });
        setAttendanceError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error("Erro ao buscar dados de presença:", err);
        setAttendanceError(
          err instanceof Error ? err.message : "Erro ao carregar dados de presença"
        );
      } finally {
        if (isMounted) setAttendanceLoading(false);
      }
    };

    fetchAttendance();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

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

    loadRole();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchFinancialData = async () => {
      setFinancialLoading(true);
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const params = new URLSearchParams({
          dataInicio: start.toISOString().split("T")[0],
          dataFim: end.toISOString().split("T")[0],
        });
        const response = await fetch(`/api/contas/dashboard?${params.toString()}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error ?? "Erro ao carregar dados financeiros");
        }

        if (!isMounted) return;

        const monthly = Array.isArray(payload.charts?.monthly) ? payload.charts.monthly : [];
        const formatted = monthly.map((item: { month: string; receitas: number; despesas: number }) => ({
          mes: item.month ? new Date(`${item.month}-01`).toLocaleDateString("pt-BR", { month: "short" }) : "",
          receitas: item.receitas ?? 0,
          despesas: item.despesas ?? 0,
        }));

        setFinancialData(formatted);
        setFinancialError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error("Erro ao buscar dados financeiros:", err);
        setFinancialError(
          err instanceof Error ? err.message : "Erro ao carregar dados financeiros"
        );
      } finally {
        if (isMounted) setFinancialLoading(false);
      }
    };

    fetchFinancialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const attendanceData = monthlyAttendance
    ? [
        {
          period: monthlyAttendance.monthLabel,
          presentes: monthlyAttendance.presentes,
          faltas: monthlyAttendance.faltas,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Dashboard</h1>
          <p className="text-sm text-emerald-700/80">Sistema de Administração de Loja</p>
        </div>
        {quickActionsDisabled ? (
          <Button
            className="bg-primary hover:bg-primary/90"
            disabled
            title="Acesso restrito ao SaaS Admin"
          >
            <Landmark className="mr-2 h-4 w-4" />
            Chancelaria
          </Button>
        ) : (
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/presencas">
              <Landmark className="mr-2 h-4 w-4" />
              Chancelaria
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          key={kpis[0].title}
          title={kpis[0].title}
          value={kpis[0].value}
          detail={kpis[0].change}
          detailClassName={kpis[0].detailClassName}
          icon={kpis[0].icon}
        />
        {kpis.slice(1).map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            detail={kpi.change}
            icon={kpi.icon}
          />
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-emerald-900">Ações rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActionsDisabled ? (
            <>
              <Button
                variant="outline"
                className="justify-start"
                disabled
                title="Acesso restrito ao SaaS Admin"
              >
                <Users className="mr-2 h-4 w-4" />
                Novo Membro
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                disabled
                title="Acesso restrito ao SaaS Admin"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Registrar Presenca
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                disabled
                title="Acesso restrito ao SaaS Admin"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Lançar Receita
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                disabled
                title="Acesso restrito ao SaaS Admin"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Sessão
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/membros/novo">
                  <Users className="mr-2 h-4 w-4" />
                  Novo Membro
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/presencas">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Registrar Presença
                </Link>
              </Button>
              <Button variant="outline" className="justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Lançar Receita
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Sessão
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-emerald-900">Receitas e Despesas</h2>
          {financialLoading ? (
            <div className="py-24 text-center text-sm text-muted-foreground">Carregando dados...</div>
          ) : financialError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {financialError}
            </div>
          ) : financialData.length === 0 ? (
            <div className="py-24 text-center text-sm text-muted-foreground">Sem dados financeiros.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number | undefined) =>
                    value ? `R$ ${value.toLocaleString("pt-BR")}` : "N/A"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="receitas"
                  stroke="oklch(0.45 0.15 145)"
                  strokeWidth={2}
                  name="Receitas"
                  dot={{ fill: "oklch(0.45 0.15 145)" }}
                />
                <Line
                  type="monotone"
                  dataKey="despesas"
                  stroke="oklch(0.55 0.22 25)"
                  strokeWidth={2}
                  name="Despesas"
                  dot={{ fill: "oklch(0.55 0.22 25)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-1 text-lg font-semibold text-emerald-900">
            Presenças x Faltas ({monthlyAttendance?.monthLabel ?? "mês atual"})
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Faltas incluem justificadas e o gráfico resume os dados do mês corrente.
          </p>
          {attendanceLoading ? (
            <div className="py-24 text-center text-sm text-muted-foreground">Carregando dados...</div>
          ) : attendanceError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {attendanceError}
            </div>
          ) : attendanceData.length === 0 ? (
            <div className="py-24 text-center text-sm text-muted-foreground">Sem registros para o período.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number) => value.toString()}
                />
                <Bar
                  dataKey="presentes"
                  fill="oklch(0.45 0.15 145)"
                  name="Presentes"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="faltas"
                  fill="oklch(0.55 0.22 25)"
                  name="Faltas (inclui justificadas)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-emerald-900">Distribuição por Idade</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riteDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Bar dataKey="value" name="Membros" radius={[6, 6, 0, 0]}>
                {riteDistribution.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={getBarGreen(index, riteDistribution.length)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-emerald-900">Distribuição por Grau</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={classDistribution}
                dataKey="value"
                nameKey="name"
                startAngle={90}
                endAngle={-270}
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                label={({ name, value }) => {
                  if (!classTotal || !value) return "";
                  const percent = Math.round((value / classTotal) * 100);
                  return `${name} ${percent}%`;
                }}
              >
                {classDistribution.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={donutColors[index % donutColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
