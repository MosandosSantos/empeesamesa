import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAuth } from "@/lib/api-auth";

const prisma = new PrismaClient();

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
}

interface CategoryData {
  name: string;
  value: number;
}

/**
 * GET /api/contas/dashboard
 * Get dashboard KPIs and chart data
 * Query params: dataInicio, dataFim (optional date range)
 */
export async function GET(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    // Default to current year if no date range provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), 0, 1);
    const defaultEnd = new Date(now.getFullYear(), 11, 31);

    const startDate = dataInicio ? new Date(dataInicio) : defaultStart;
    const endDate = dataFim ? new Date(dataFim) : defaultEnd;

    // Fetch all lancamentos within date range
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        tenantId: payload!.tenantId,
        dataVencimento: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        categoria: {
          select: {
            nome: true,
          },
        },
      },
    });

    // Calculate KPIs
    let totalAPagar = 0;
    let totalAReceber = 0;
    let totalPago = 0;
    let totalRecebido = 0;

    lancamentos.forEach((lanc) => {
      if (lanc.tipo === "RECEITA") {
        totalAReceber += lanc.valorPrevisto;
        totalRecebido += lanc.valorPago;
      } else if (lanc.tipo === "DESPESA") {
        totalAPagar += lanc.valorPrevisto;
        totalPago += lanc.valorPago;
      }
    });

    const saldoPrevisto = totalAReceber - totalAPagar;
    const saldoRealizado = totalRecebido - totalPago;

    // Group by month for chart
    const monthlyMap = new Map<string, { receitas: number; despesas: number }>();

    lancamentos.forEach((lanc) => {
      const month = lanc.dataVencimento.toISOString().slice(0, 7); // YYYY-MM

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { receitas: 0, despesas: 0 });
      }

      const monthData = monthlyMap.get(month)!;
      if (lanc.tipo === "RECEITA") {
        monthData.receitas += lanc.valorPago;
      } else {
        monthData.despesas += lanc.valorPago;
      }
    });

    // Convert to array and sort by month
    const monthlyData: MonthlyData[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        receitas: data.receitas,
        despesas: data.despesas,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by category for pie chart (using valorPago)
    const categoryMap = new Map<string, number>();

    lancamentos.forEach((lanc) => {
      const categoryName = lanc.categoria.nome;
      const current = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, current + lanc.valorPago);
    });

    const categoryData: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
      }))
      .filter((item) => item.value > 0) // Only include categories with transactions
      .sort((a, b) => b.value - a.value); // Sort by value descending

    // Separate category data by type
    const receitasByCategory = new Map<string, number>();
    const despesasByCategory = new Map<string, number>();

    lancamentos.forEach((lanc) => {
      const categoryName = lanc.categoria.nome;
      if (lanc.tipo === "RECEITA") {
        const current = receitasByCategory.get(categoryName) || 0;
        receitasByCategory.set(categoryName, current + lanc.valorPago);
      } else {
        const current = despesasByCategory.get(categoryName) || 0;
        despesasByCategory.set(categoryName, current + lanc.valorPago);
      }
    });

    const receitasCategories: CategoryData[] = Array.from(receitasByCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const despesasCategories: CategoryData[] = Array.from(despesasByCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      kpis: {
        totalAPagar,
        totalAReceber,
        totalPago,
        totalRecebido,
        saldoPrevisto,
        saldoRealizado,
      },
      charts: {
        monthly: monthlyData,
        categoryAll: categoryData,
        receitasCategories,
        despesasCategories,
      },
    });
  } catch (error) {
    console.error("GET /api/contas/dashboard error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
