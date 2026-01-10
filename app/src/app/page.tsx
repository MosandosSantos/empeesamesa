"use server";

import prisma from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

const ageBuckets = [
  { label: "21-30", min: 21, max: 30 },
  { label: "31-40", min: 31, max: 40 },
  { label: "41-50", min: 41, max: 50 },
  { label: "51-60", min: 51, max: 60 },
  { label: "61-70", min: 61, max: 70 },
  { label: "71-75", min: 71, max: 75 },
];

export default async function Home() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const activeMembers = await prisma.member.count({ where: { situacao: "ATIVO" } });
  const newMembersLast12Months = await prisma.member.count({
    where: {
      createdAt: {
        gte: twelveMonthsAgo,
      },
    },
  });
  const saldoByTipo = await prisma.lancamento.groupBy({
    by: ["tipo"],
    _sum: { valorPago: true },
    where: {
      dataVencimento: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  const totalReceitas = saldoByTipo.find((item) => item.tipo === "RECEITA")?._sum.valorPago ?? 0;
  const totalDespesas = saldoByTipo.find((item) => item.tipo === "DESPESA")?._sum.valorPago ?? 0;
  const saldoMes = totalReceitas - totalDespesas;
  const solicitacoesAbertas = 0;
  const solicitacoesRecebidas = 0;
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      minQty: { gt: 0 },
      archivedAt: null,
    },
    select: {
      minQty: true,
      qtyOnHand: true,
    },
  });
  const belowMinCount = lowStockItems.filter((item) => item.qtyOnHand <= item.minQty).length;

  const classCounts = await prisma.member.groupBy({
    by: ["class"],
    _count: { _all: true },
    where: { situacao: "ATIVO" },
  });

  const membersWithBirthdays = await prisma.member.findMany({
    where: {
      situacao: "ATIVO",
    },
    select: {
      dataNascimento: true,
    },
  });

  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const bucketCounts = ageBuckets.map(() => 0);

  membersWithBirthdays.forEach(({ dataNascimento }) => {
    if (!dataNascimento) return;
    const age = Math.floor((now.getTime() - dataNascimento.getTime()) / millisecondsPerYear);
    const bucketIndex = ageBuckets.findIndex((bucket) => age >= bucket.min && age <= bucket.max);
    if (bucketIndex !== -1) {
      bucketCounts[bucketIndex]++;
    }
  });

  const classOrder = ["AP", "CM", "MM", "MI"];
  const classMap = new Map(classCounts.map((item) => [item.class ?? "", item._count._all]));
  const classDistribution = classOrder.map((key) => ({
    name: key,
    value: classMap.get(key) ?? 0,
  }));

  const riteDistribution = ageBuckets.map((bucket, index) => ({
    name: bucket.label,
    value: bucketCounts[index],
  }));

  return (
    <DashboardClient
      activeMembers={activeMembers}
      newMembersLast12Months={newMembersLast12Months}
      belowMinCount={belowMinCount}
      saldoMes={saldoMes}
      solicitacoesAbertas={solicitacoesAbertas}
      solicitacoesRecebidas={solicitacoesRecebidas}
      classDistribution={classDistribution}
      riteDistribution={riteDistribution}
    />
  );
}
