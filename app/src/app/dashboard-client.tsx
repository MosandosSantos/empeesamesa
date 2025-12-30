"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { MinimumStockCard } from "@/components/inventario/minimum-stock-card";
import { Users, TrendingUp, DollarSign, Calendar, CheckCircle2 } from "lucide-react";
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
  belowMinCount: number;
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
  belowMinCount,
  riteDistribution,
  classDistribution,
}: DashboardClientProps) {
  const classTotal = classDistribution.reduce((acc, item) => acc + item.value, 0);
  const kpis = [
    {
      title: "Membros Ativos",
      value: activeMembers.toString(),
      change: "Contagem real do banco",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Receitas",
      value: "R$ 12.450",
      change: "Este mês",
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Despesas",
      value: "R$ 8.320",
      change: "Este mês",
      icon: DollarSign,
      color: "text-destructive",
    },
  ];


  const financialData = [
    { mes: "Jul", receitas: 11200, despesas: 7800 },
    { mes: "Ago", receitas: 12100, despesas: 8100 },
    { mes: "Set", receitas: 11800, despesas: 8500 },
    { mes: "Out", receitas: 13200, despesas: 7900 },
    { mes: "Nov", receitas: 12450, despesas: 8320 },
    { mes: "Dez", receitas: 13500, despesas: 8000 },
  ];

  const attendanceData = [
    { sessao: "01/11", presentes: 38, ausentes: 4 },
    { sessao: "08/11", presentes: 35, ausentes: 7 },
    { sessao: "15/11", presentes: 40, ausentes: 2 },
    { sessao: "22/11", presentes: 37, ausentes: 5 },
    { sessao: "29/11", presentes: 39, ausentes: 3 },
    { sessao: "06/12", presentes: 41, ausentes: 1 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do sistema de gestão</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/presencas">
            <Calendar className="mr-2 h-4 w-4" />
            Próxima Sessão
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          key={kpis[0].title}
          title={kpis[0].title}
          value={kpis[0].value}
          detail={kpis[0].change}
          icon={kpis[0].icon}
          iconClassName={kpis[0].color}
        />
        <MinimumStockCard
          title="Estoque minimo"
          description="Itens criticos para reposicao"
          value={belowMinCount}
          showAlert={belowMinCount > 0}
        />
        {kpis.slice(1).map((kpi) => {
          return (
            <KpiCard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              detail={kpi.change}
              icon={kpi.icon}
              iconClassName={kpi.color}
            />
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-card-foreground">Ações Rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">Receitas e Despesas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
                formatter={(value: number | undefined) => (value ? `R$ ${value.toLocaleString("pt-BR")}` : "N/A")}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }} />
              <Line type="monotone" dataKey="receitas" stroke="oklch(0.45 0.15 145)" strokeWidth={2} name="Receitas" dot={{ fill: "oklch(0.45 0.15 145)" }} />
              <Line type="monotone" dataKey="despesas" stroke="oklch(0.55 0.22 25)" strokeWidth={2} name="Despesas" dot={{ fill: "oklch(0.55 0.22 25)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">Presença por Sessão</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="sessao" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }} />
              <Bar dataKey="presentes" fill="oklch(0.45 0.15 145)" name="Presentes" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ausentes" fill="oklch(0.55 0.22 25)" name="Ausentes" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">Distribuição por Rito</h2>
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
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
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
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">Distribuição por Classe</h2>
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
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

