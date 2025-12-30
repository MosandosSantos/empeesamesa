"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
}

interface MonthlyChartProps {
  data: MonthlyData[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  // Transform YYYY-MM to "Mês/Ano" format
  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-");
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("pt-BR", {
      month: "short",
    });
    const receitas = Number(item.receitas) || 0;
    const despesas = Number(item.despesas) || 0;
    return {
      ...item,
      receitas,
      despesas,
      monthLabel: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year.slice(2)}`,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="monthLabel"
            className="text-sm"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            className="text-sm"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
          />
          <Line
            type="monotone"
            dataKey="receitas"
            name="Receitas"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3, fill: "#16a34a" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="despesas"
            name="Despesas"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ r: 3, fill: "#dc2626" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
